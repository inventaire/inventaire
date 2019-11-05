CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdEdit = require 'wikidata-edit'
wdOauth = require './wikidata_oauth'
{ Promise } = __.require 'lib', 'promises'
validateEntity = require './validate_entity'
getEntityType = require './get_entity_type'
properties = require './properties/properties_values_constraints'
{ prefixifyWd, unprefixify } = require './prefix'
whitelistedEntityTypes = [ 'work', 'serie', 'human' ]

module.exports = (params)-> Promise.try -> createWdEntity params

createWdEntity = (params)->
  { labels, claims, user } = params
  wdOauth.validate user
  oauth = wdOauth.getFullCredentials user

  _.log { labels, claims }, 'wd entity creation'

  validateEntity { labels, claims }
  .then validateWikidataCompliance
  .then format
  .then wdEdit({ oauth }, 'entity/create')
  .then (res)->
    { entity } = res
    unless entity?
      throw error_.new 'invalid wikidata-edit response', 500, { res }

    entity.uri = prefixifyWd entity.id
    return entity

validateWikidataCompliance = (entity)->
  { claims } = entity
  unless claims? then throw error_.new 'invalid entity', 400, entity

  entityType = getEntityType claims['wdt:P31']
  unless entityType in whitelistedEntityTypes
    throw error_.new 'invalid entity type', 400, { entityType, entity }

  for property, values of claims
    if properties[property].datatype is 'entity'
      for value in values
        if value.split(':')[0] is 'inv'
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
