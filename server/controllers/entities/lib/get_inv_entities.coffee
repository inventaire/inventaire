__ = require('config').universalPath
entities_ = require './entities'
getEntityType = __.require 'lib', 'wikidata/get_entity_type'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
getInvEntityCanonicalUri = require './get_inv_entity_canonical_uri'

module.exports = (ids)->
  # Hypothesis: there is no need to look for Wikidata data here
  # as inv entities with an associated Wikidata entity use the Wikidata uri
  entities_.byIds ids
  .map format
  .then (entities)-> { entities }

format = (entity)->
  [ uri, redirects ] = getInvEntityCanonicalUri entity
  entity.uri = uri
  if redirects? then entity.redirects = redirects

  entity.type = getEntityType entity.claims['wdt:P31']
  entity.originalLang = getOriginalLang entity.claims

  # Matching Wikidata entities format for images
  # Here we are missing license, credits, and author attributes
  entity.image =
    url: entity.claims['wdt:P18']?[0]

  return entity
