const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const { Track } = require('lib/track')
const sanitize = require('lib/sanitize/sanitize')
const moveToWikidata = require('./lib/move_to_wikidata')

const sanitization = {
  uri: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => moveToWikidata(req.user, params.uri))
  .then(responses_.Send(res))
  .then(Track(req, [ 'entity', 'moveToWikidata' ]))
  .catch(error_.Handler(req, res))
}
