__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
{ Promise } = __.require 'lib', 'promises'
getEntitiesPopularity = require './lib/get_entities_popularity'

module.exports = (req, res, next)->
  { uris, refresh } = req.query

  unless _.isNonEmptyString uris
    return error_.bundleMissingQuery req, res, 'uris'

  uris = _.uniq uris.split('|')

  # TODO: when passing a refresh flag, return the old popularity value
  # instead of the default value, as getEntitiesPopularity would do
  # for Wikidata entities
  refresh = _.parseBooleanString refresh

  getEntitiesPopularity uris, refresh
  .then responses_.Wrap(res, 'scores')
  .catch error_.Handler(req, res)
