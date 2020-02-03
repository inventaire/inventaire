const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  description: {},
  listing: {
    whitelist: [ 'public', 'private', 'network' ]
  },
  name: {},
  items: { optional: true }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    return shelves_.create(params)
    .then(responses_.Wrap(res, 'shelf'))
    .then(Track(req, [ 'shelf', 'creation' ]))
  })
  .catch(error_.Handler(req, res))
}
