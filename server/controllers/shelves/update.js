const __ = require('config').universalPath
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const { Track } = require('lib/track')
const shelves_ = require('controllers/shelves/lib/shelves')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  shelf: {},
  description: { optional: true },
  listing: {
    allowlist: [ 'public', 'private', 'network' ],
    optional: true
  },
  name: { optional: true }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(shelves_.updateAttributes)
  .then(responses_.Wrap(res, 'shelf'))
  .then(Track(req, [ 'shelf', 'update' ]))
  .catch(error_.Handler(req, res))
}
