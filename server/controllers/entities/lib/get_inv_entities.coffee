CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
getEntityType = require './get_entity_type'
getInvEntityCanonicalUri = require './get_inv_entity_canonical_uri'
formatEntityCommon = require './format_entity_common'
addRedirection = require './add_redirection'
{ prefixifyInv, unprefixify } = __.require 'controllers', 'entities/lib/prefix'

# Working around the circular dependency
getEntityByUri = null
lateRequire = -> getEntityByUri = require './get_entity_by_uri'
setTimeout lateRequire, 0

module.exports = (ids, params)->
  # Hypothesis: there is no need to look for Wikidata data here
  # as inv entities with an associated Wikidata entity use the Wikidata uri
  entities_.byIds ids
  .map Format(params)
  .then (entities)->
    found = entities.reduce aggregateFoundIds, []
    notFound = _.difference(ids, found).map prefixifyInv
    return { entities, notFound }

Format = (params)-> (entity)->
  if entity.redirect? then return getRedirectedEntity entity, params

  [ uri, redirects ] = getInvEntityCanonicalUri entity
  entity.uri = uri
  if redirects? then entity.redirects = redirects

  # Keep track of special types such as removed:placehoder
  # to the let the search engine unindex it
  if entity.type isnt 'entity' then entity._meta_type = entity.type

  entity.type = getEntityType entity.claims['wdt:P31']
  return formatEntityCommon entity

getRedirectedEntity = (entity, params)->
  { refresh, dry } = params
  # Passing the parameters as the entity data source might be Wikidata
  getEntityByUri { uri: entity.redirect, refresh, dry }
  .then addRedirection.bind(null, prefixifyInv(entity._id))

aggregateFoundIds = (foundIds, entity)->
  { _id, redirects } = entity
  # Won't be true if the entity redirected to a Wikidata entity
  if _id? then foundIds.push _id
  if redirects? then foundIds.push unprefixify(redirects.from)
  return foundIds
