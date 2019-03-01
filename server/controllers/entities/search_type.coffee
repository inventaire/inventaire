# A search endpoint dedicated to searching entities by types
# to fit the needs of autocomplete searches
# Relies on a local ElasticSearch instance loaded with Inventaire and Wikidata entities
# See https://github.com/inventaire/entities-search-engine
# and server/controllers/entities/lib/update_search_engine

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
sanitize = __.require 'lib', 'sanitize/sanitize'
error_ = __.require 'lib', 'error/error'
searchType = require './lib/search_type'

indexedTypes = [
  'works'
  'humans'
  'series'
  'genres'
  'movements'
  'publishers'
  'collections'
]

sanitization =
  type:
    whitelist: indexedTypes
  search: {}
  limit:
    default: 20

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { type, search, limit } = params
    return searchType search, type, limit
  .then responses_.Wrap(res, 'results')
  .catch error_.Handler(req, res)
