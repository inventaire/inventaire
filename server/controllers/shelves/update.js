const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  shelf: {},
  description: { optional: true },
  listing: {
    whitelist: [ 'public', 'private', 'network' ],
    optional: true
  },
  name: { optional: true }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { shelfId } = params
    return shelves_.updateAttributes(params, shelfId)
    .then(responses_.Wrap(res, 'shelf'))
    .then(Track(req, [ 'shelf', 'update' ]))
  })
  .catch(error_.Handler(req, res))
}
