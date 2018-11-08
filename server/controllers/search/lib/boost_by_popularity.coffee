CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getEntitiesPopularity = __.require 'controllers', 'entities/lib/get_entities_popularity'

module.exports = (results)->
  entityUris = _.compact _.map(results, 'uri')
  getEntitiesPopularity entityUris
  .then sortResultsByPopularity(results)

sortResultsByPopularity = (results)-> (popularityByUri)->
  results
  .map setGlobalScore(popularityByUri)
  .sort (a, b)-> b.globalScore - a.globalScore

setGlobalScore = (popularityByUri)-> (result)->
  popularity = if result.uri? then popularityByUri[result.uri] else 1
  result.globalScore = boostScore result.lexicalScore, popularity
  return result

logFactor = 2
# Inspired by https://www.elastic.co/guide/en/elasticsearch/guide/current/boosting-by-popularity.html
boostScore = (score, popularity)->
  return score * Math.log(1 + logFactor * popularity)
