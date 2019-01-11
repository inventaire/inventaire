CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'
getPopularityByUri = require './get_popularity_by_uri'

module.exports = (uris, refresh)->
  if uris.length is 0 then return promises_.resolve {}
  urisPopularity = _.indexAppliedValue uris, getPopularity(refresh)
  return promises_.props urisPopularity

getPopularity = (refresh)-> (uri)->
  unless _.isEntityUri(uri) then throw error_.new 'invalid uri', 400, uri

  key = "popularity:#{uri}"
  fn = getPopularityByUri.bind null, uri

  cache_.get { key, fn, refresh, dryAndCache: true, dryFallbackValue: 0 }
