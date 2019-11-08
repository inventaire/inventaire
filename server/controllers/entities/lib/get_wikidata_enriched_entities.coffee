# Get and format Wikidata entities to match Inventaire entities:
# - simplify claims
# - add attributes: uri, originalLang
# - delete unnecessary attributes and ignore undesired claims
#   such as ISBNs defined on work entities

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
wdk = require 'wikidata-sdk'
getOriginalLang = __.require 'lib', 'wikidata/get_original_lang'
formatClaims = __.require 'lib', 'wikidata/format_claims'
{ simplify } = wdk
getEntityType = require './get_entity_type'
{ prefixifyWd } = __.require 'controllers', 'entities/lib/prefix'
entities_ = require './entities'
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'
getWdEntity = __.require 'data', 'wikidata/get_entity'
addImageData = require './add_image_data'
radio = __.require 'lib', 'radio'
propagateRedirection = require './propagate_redirection'
{ _id:hookUserId } = __.require('couch', 'hard_coded_documents').users.hook

module.exports = (ids, params)->
  promises_.all ids.map(getCachedEnrichedEntity(params))
  .then (entities)->
    if params.dry then entities = _.compact entities
    return { entities }

getCachedEnrichedEntity = (params)-> (wdId)->
  key = "wd:enriched:#{wdId}"
  fn = getEnrichedEntity.bind null, wdId
  { refresh, dry } = params
  cache_.get { key, fn, refresh, dry }

getEnrichedEntity = (wdId)->
  getWdEntity wdId
  .then format

format = (entity)->
  if entity.missing?
    # Make sure the entity is unindexed
    radio.emit 'wikidata:entity:cache:miss', entity.id
    return formatEmpty 'missing', entity

  { P31, P279 } = entity.claims
  if P31? or P279?
    simplifiedP31 = wdk.simplifyPropertyClaims P31, simplifyClaimsOptions
    simplifiedP279 = wdk.simplifyPropertyClaims P279, simplifyClaimsOptions
    entity.type = getEntityType simplifiedP31, simplifiedP279
  else
    # Make sure to override the type as Wikidata entities have a type with
    # another role in Wikibase, and we need this absence of known type to
    # filter-out entities that aren't in our focus (i.e. not works, author, etc)
    entity.type = null

  radio.emit 'wikidata:entity:cache:miss', entity.id, entity.type

  entity.claims = omitUndesiredPropertiesPerType entity.type, entity.claims

  if entity.type is 'meta' then return formatEmpty 'meta', entity
  else return formatValidEntity entity

simplifyClaimsOptions = { entityPrefix: 'wd' }

formatValidEntity = (entity)->
  { id:wdId } = entity
  entity.uri = "wd:#{wdId}"
  entity.labels = simplify.labels entity.labels
  entity.aliases = simplify.aliases entity.aliases
  entity.descriptions = simplify.descriptions entity.descriptions
  entity.sitelinks = simplify.sitelinks entity.sitelinks
  entity.claims = formatClaims entity.claims, wdId
  entity.originalLang = getOriginalLang entity.claims

  formatAndPropagateRedirection entity

  # Deleting unnecessary attributes
  delete entity.id
  delete entity.modified
  delete entity.pageid
  delete entity.ns
  delete entity.title
  delete entity.lastrevid

  return addImageData entity

formatAndPropagateRedirection = (entity)->
  if entity.redirects?
    { from, to } = entity.redirects
    entity.redirects =
      from: prefixifyWd from
      to: prefixifyWd to

    # Take advantage of this request for a Wikidata entity to check
    # if there is a redirection we are not aware of, and propagate it:
    # if the redirected entity is used in Inventaire claims, redirect claims
    # to their new entity
    propagateRedirection hookUserId, entity.redirects.from, entity.redirects.to
    radio.emit 'wikidata:entity:redirect', entity.redirects.from, entity.redirects.to

  return

formatEmpty = (type, entity)->
  # Keeping just enough data to filter-out while not cluttering the cache
  id: entity.id
  uri: "wd:#{entity.id}"
  type: type

omitUndesiredPropertiesPerType = (type, claims)->
  propertiesToOmit = undesiredPropertiesPerType[type]
  if propertiesToOmit? then _.omit claims, propertiesToOmit
  else claims

undesiredPropertiesPerType =
  # Ignoring ISBN data set on work entities, as those
  # should be the responsability of edition entities
  work: [ 'P212', 'P957' ]

# Not really related, out of the fact that it listen for
# 'wikidata:entity:cache:miss', but that needed to be initialized somewhere
require('./update_search_engine')()
