__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'
wd_ = __.require 'lib', 'wikidata'
{ Promise } = __.require 'lib', 'promises'
wdk = require 'wikidata-sdk'
{ normalizeIsbn, isNormalizedIsbn } = __.require 'lib', 'isbn/isbn'
getWikidataEnrichedEntities = require './lib/get_wikidata_enriched_entities'
getEntitiesByIsbns = require './lib/get_entities_by_isbns'
indexById = require './lib/index_by_id'

module.exports = (req, res, next)->
  { prefix, ids } = req.query

  prefix or= 'inv'

  unless prefix in prefixes
    return error_.bundle req, res, "unknown prefix: #{prefix}", 400, req.query

  unless _.isNonEmptyString ids
    return error_.bundle req, res, "ids can't be empty", 400, req.query

  ids = ids.split '|'
  if prefix in hasFormatter then ids = ids.map formatters[prefix]

  unless _.all ids, validators[prefix]
    return error_.bundle req, res, "invalid ids for prefix #{prefix}", 400, req.query

  getters[prefix](ids)
  .then WrapWithIndex(res, prefix)
  .catch error_.Handler(req, res)

WrapWithIndex = (res, prefix)-> (data)->
  if prefix in hasIndexer
    data.index = getReverseIndex prefix, data.entities
  res.json data

getInvEntities = (ids)->
  # TODO: merge Wikidata entities data if the returned entities are linked to one
  # through the invp:P1 property
  entities_.byIds ids
  .then indexById
  .then (entities)-> { entities }

# Take ids, return an object on the model { entities, seeds (optional) }
getters =
  inv: getInvEntities
  wd: getWikidataEnrichedEntities
  isbn: getEntitiesByIsbns

prefixes = Object.keys getters

formatters =
  isbn: normalizeIsbn

hasFormatter = Object.keys formatters

validators =
  inv: _.isInvEntityId
  wd: wdk.isWikidataEntityId
  isbn: isNormalizedIsbn

reverseIndexProperties =
  wd: 'invp:P1'
  isbn: 'wdt:P212'

hasIndexer = Object.keys reverseIndexProperties

getReverseIndex = (prefix, entities)->
  indexProperty = reverseIndexProperties[prefix]
  index = {}

  prefixIsIsbn = prefix is 'isbn'

  for id, entity of entities
    _.log entity, id
    indexPropertyValue = entity.claims[indexProperty]?[0]
    if indexPropertyValue?
      index[indexPropertyValue] = id
      # Add a non-hypenated entry for convenience
      if prefixIsIsbn then index[normalizeIsbn(indexPropertyValue)] = id

  return index
