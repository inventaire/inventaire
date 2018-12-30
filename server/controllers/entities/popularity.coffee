__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
sanitize = __.require 'lib', 'sanitize/sanitize'
{ Promise } = __.require 'lib', 'promises'
getEntitiesPopularity = require './lib/get_entities_popularity'

sanitization =
  uris: {}
  refresh: { optional: true }

module.exports = (req, res, next)->
  # TODO: when passing a refresh flag, return the old popularity value
  # instead of the default value, as getEntitiesPopularity would do
  # for Wikidata entities
  sanitize req, res, sanitization
  .then (params)->
    { uris, refresh } = params
    getEntitiesPopularity uris, refresh
  .then responses_.Wrap(res, 'scores')
  .catch error_.Handler(req, res)
