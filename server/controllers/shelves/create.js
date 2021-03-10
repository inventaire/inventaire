const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const { Track } = require('lib/track')
const shelves_ = require('controllers/shelves/lib/shelves')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  name: {},
  description: { optional: true },
  listing: {
    allowlist: [ 'public', 'private', 'network' ]
  },
  items: { optional: true }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(formatNewShelf)
  .then(responses_.Wrap(res, 'shelf'))
  .then(Track(req, [ 'shelf', 'creation' ]))
  .catch(error_.Handler(req, res))
}

const formatNewShelf = params => {
  const { name, description, listing, reqUserId: owner } = params
  return shelves_.create({
    name,
    description,
    listing,
    owner,
  })
}
