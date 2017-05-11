# A search endpoint dedicated to searching local entities and return results
# filtered by entity type, to fit the needs of autocomplete searches
# Wikidata entities are queries separately to our Wikidata Subset Search Engine
# See https://github.com/inventaire/wikidata-subset-search-engine
# and server/controllers/entities/lib/update_wikidata_subset_search_engine

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
searchLocalEntities = require './lib/search_local'
getEntityType = require './lib/get_entity_type'
indexedTypes = [ 'work', 'edition', 'human', 'serie' ]

module.exports = (req, res)->
  { type, search } = req.query

  _.info [ type, search ], 'entities local search'

  unless _.isNonEmptyString search
    return error_.bundleMissingQuery req, res, 'search'

  unless _.isNonEmptyString type
    return error_.bundleMissingQuery req, res, 'type'

  # Accept plural form
  type = type.replace /s$/, ''

  unless type in indexedTypes
    return error_.bundleInvalid req, res, 'type', type

  searchLocalEntities search
  .map addType
  .filter byType(type)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

addType = (entity)->
  entity.type = getEntityType entity.claims['wdt:P31']
  return entity

byType = (type)-> (entity)-> entity.type is type
