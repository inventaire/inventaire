__ = require('config').universalPath
entities_ = require './entities'
getEntityType = __.require 'lib', 'wikidata/get_entity_type'
getInvEntityCanonicalUri = require './get_inv_entity_canonical_uri'
formatEntityCommon = require './format_entity_common'
addRedirection = require './add_redirection'

module.exports = (ids, refresh)->
  # Hypothesis: there is no need to look for Wikidata data here
  # as inv entities with an associated Wikidata entity use the Wikidata uri
  entities_.byIds ids
  .map Format(refresh)
  .then (entities)-> { entities }

Format = (refresh)-> (entity)->
  if entity.redirect? then return getRedirectedEntity entity, refresh

  [ uri, redirects ] = getInvEntityCanonicalUri entity
  entity.uri = uri
  if redirects? then entity.redirects = redirects

  entity.type = getEntityType entity.claims['wdt:P31']
  return formatEntityCommon entity

getRedirectedEntity = (entity, refresh)->
  # Circular dependency workaround: late require, relying on require caching mechanism
  getEntityByUri = require './get_entity_by_uri'

  # Passing the refresh parameter as the entity data source might be Wikidata
  getEntityByUri entity.redirect, refresh
  .then addRedirection.bind(null, "inv:#{entity._id}")
