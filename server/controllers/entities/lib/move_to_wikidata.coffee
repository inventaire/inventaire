__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
promises_ = __.require 'lib', 'promises'
getEntityType = require './get_entity_type'
wdEdit = require 'wikidata-edit'
{ wikidataOAuth } = require('config')
mergeEntities = require './merge_entities'
{ properties } = require './properties'
{ prefixifyWd, unprefixify } = require './prefix'
whitelistedEntityTypes = [ 'work', 'serie', 'human' ]

module.exports = (user, invEntityUri)->
  { oauth, _id: reqUserId } = user
  userWikidataOAuth = user.oauth?.wikidata

  unless userWikidataOAuth?
    throw error_.reject 'missing wikidata oauth tokens', 400

  oauth = _.extend userWikidataOAuth, wikidataOAuth

  entityId = unprefixify invEntityUri

  entities_.byId entityId
  .then validateWikidataCompliance
  .then format
  .then wdEdit({ oauth }, 'entity/create')
  .then (res)->
    unless res.entity?
      throw error_.new 'invalid wikidata-edit response', 500, { invEntityUri, res }

    wdEntityUri = prefixifyWd res.entity.id

    mergeEntities reqUserId, invEntityUri, wdEntityUri
    .then -> { uri: wdEntityUri }

validateWikidataCompliance = (entity)->
  { claims } = entity
  unless claims? then throw error_.new 'invalid entity', 400, entity

  entityType = getEntityType claims['wdt:P31']
  unless entityType in whitelistedEntityTypes
    throw error_.new 'invalid entity type', 400, { entityType, entity }

  for property, values of claims
    if properties[property].datatype is 'entity'
      for value in values
        if value.split(':')[0] isnt 'inv'
          throw error_.new 'claim value is an inv uri', 400, { property, value }

  return entity

format = (entity)->
  { claims } = entity
  entity.claims = Object.keys(claims)
    .reduce unprefixifyClaims(claims), {}
  return entity

unprefixifyClaims = (claims)-> (formattedClaims, property)->
  unprefixifiedProp = unprefixify property
  propertyValues = claims[property]

  if properties[property].datatype is 'entity'
    formattedClaims[unprefixifiedProp] = propertyValues.map unprefixify
  else
    # datatype 'string' should not be unprefixified, ex: 'Jules Vernes'
    formattedClaims[unprefixifiedProp] = propertyValues
  return formattedClaims
