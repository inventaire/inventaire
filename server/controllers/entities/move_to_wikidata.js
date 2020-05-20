const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const sanitize = __.require('lib', 'sanitize/sanitize')
const moveToWikidata = require('./lib/move_to_wikidata')

const sanitization = {
  uri: {},
  asP31value: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => moveToWikidata(req.user, params.uri, params.asP31value))
  .then(responses_.Send(res))
  .then(Track(req, [ 'entity', 'moveToWikidata' ]))
  .catch(error_.Handler(req, res))
}
