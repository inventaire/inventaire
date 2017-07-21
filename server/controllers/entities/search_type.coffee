# A search endpoint dedicated to searching entities by types
# to fit the needs of autocomplete searches
# Relies on a local ElasticSearch instance loaded with Inventaire and Wikidata entities
# See https://github.com/inventaire/wikidata-subset-search-engine
# and server/controllers/entities/lib/update_search_engine

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
searchType = require './lib/search_type'
searchIndexes = Object.keys searchType
getEntityType = require './lib/get_entity_type'
{ typesNames } = __.require 'lib', 'wikidata/aliases'

indexedTypes = [ 'works', 'humans', 'series', 'genres', 'movements', 'publishers' ]

module.exports = (req, res)->
  { index, type, search } = req.query

  _.info [ index, type, search ], 'entities local search'

  unless _.isNonEmptyString index
    return error_.bundleMissingQuery req, res, 'index'

  unless index in searchIndexes
    return error_.bundleInvalid req, res, 'index', index

  unless _.isNonEmptyString search
    return error_.bundleMissingQuery req, res, 'search'

  unless _.isNonEmptyString type
    return error_.bundleMissingQuery req, res, 'type'

  unless type in indexedTypes
    return error_.bundleInvalid req, res, 'type', type

  searchType[index](search, type)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
