CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
getEntityType = require './get_entity_type'
getInvEntityCanonicalUri = require './get_inv_entity_canonical_uri'
formatEntityCommon = require './format_entity_common'
addRedirection = require './add_redirection'
{ prefixifyInv, unprefixify } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (ids, refresh)->
  # Hypothesis: there is no need to look for Wikidata data here
  # as inv entities with an associated Wikidata entity use the Wikidata uri
  entities_.byIds ids
  .map Format(refresh)
  .then (entities)->
    found = entities.reduce aggregateFoundIds, []
    notFound = _.difference(ids, found).map prefixifyInv
    return { entities, notFound }

Format = (refresh)-> (entity)->
  if entity.redirect? then return getRedirectedEntity entity, refresh

  [ uri, redirects ] = getInvEntityCanonicalUri entity
  entity.uri = uri
  if redirects? then entity.redirects = redirects

  # Keep track of special types such as removed:placehoder
  # to the let the search engine unindex it
  if entity.type isnt 'entity' then entity._meta_type = entity.type

  entity.type = getEntityType entity.claims['wdt:P31']
  return formatEntityCommon entity

getRedirectedEntity = (entity, refresh)->
  # Circular dependency workaround: late require, relying on require caching mechanism
  getEntityByUri = require './get_entity_by_uri'

  # Passing the refresh parameter as the entity data source might be Wikidata
  getEntityByUri entity.redirect, refresh
  .then addRedirection.bind(null, prefixifyInv(entity._id))

aggregateFoundIds = (foundIds, entity)->
  { _id, redirects } = entity
  # Won't be true if the entity redirected to a Wikidata entity
  if _id? then foundIds.push _id
  if redirects? then foundIds.push unprefixify(redirects.from)
  return foundIds
