CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'
getPopularityByUri = require './get_popularity_by_uri'
# If an entity is on Wikidata, consider it to be already somewhat popular
wdEntityBaseScore = 10

module.exports = (uris, refresh)->
  if uris.length is 0 then return promises_.resolve {}
  urisPopularity = _.indexAppliedValue uris, getPopularity(refresh)
  return promises_.props urisPopularity

getPopularity = (refresh)-> (uri)->
  unless _.isEntityUri(uri) then throw error_.new 'invalid uri', 400, uri

  key = buildKey uri
  fn = getPopularityByUri.bind null, uri

  cache_.get { key, fn, refresh }
  .then applyDefaultValue(uri)

buildKey = (uri)-> "popularity:#{uri}"

applyDefaultValue = (uri)-> (value)->
  if value? then return value
  prefix = uri.split(':')[0]
  if prefix is 'wd' then return wdEntityBaseScore
  # Returning 0 if the cache is currently empty, which is kind of rational:
  # if the cache is empty, the entity isn't that popular
  return 0
