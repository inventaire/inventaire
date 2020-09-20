const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

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
  const { description, listing, name, reqUserId: owner } = params
  const newShelf = {
    name,
    description: description || '',
    listing: listing || 'private',
    owner
  }
  return shelves_.create(newShelf)
}
