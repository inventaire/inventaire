const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { updateSettings: validateGroupAdmin } = __.require('controllers', 'groups/lib/membership_validations')

const sanitization = {
  name: {},
  description: { optional: true },
  listing: {
    allowlist: [ 'public', 'private', 'network' ]
  },
  items: { optional: true },
  group: { optional: true }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(formatNewShelf)
  .then(responses_.Wrap(res, 'shelf'))
  .then(Track(req, [ 'shelf', 'creation' ]))
  .catch(error_.Handler(req, res))
}

const formatNewShelf = async params => {
  const { name, description, listing, reqUserId, group } = params
  let owner = reqUserId
  if (group) {
    await validateGroupAdmin(reqUserId, group)
    owner = group
  }
  return shelves_.create({
    name,
    description,
    listing,
    owner,
  })
}
