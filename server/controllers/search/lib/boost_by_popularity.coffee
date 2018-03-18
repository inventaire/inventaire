CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getEntitiesPopularity = __.require 'controllers', 'entities/lib/get_entities_popularity'

module.exports = (results)->
  # results entities keys : id, type, uri, label, lexicalScore
  entityUris = _.compact _.pluck(results, 'uri')
  getEntitiesPopularity entityUris
  .then (popularityByUri)->
    results.map (result)->
      if result.uri?
        popularity = popularityByUri[result.uri]
      else
        popularity = 1
      result.globalScore = result.lexicalScore + popularity
      result
    .sort (a, b)-> b.globalScore - a.globalScore
