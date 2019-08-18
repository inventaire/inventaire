CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getWdEntity = __.require 'data', 'wikidata/get_entity'
wdk = require 'wikidata-sdk'
wdEdit = require 'wikidata-edit'
wdOauth = require './wikidata_oauth'
properties = require './properties/properties_values_constraints'

module.exports = (args...)-> Promise.try -> updateWdClaim args...

updateWdClaim = (user, id, property, oldVal, newVal)->
  wdOauth.validate user

  if properties[property].datatype is 'entity' and _.isInvEntityUri newVal
    throw error_.new "wikidata entities can't link to inventaire entities", 400

  oldVal = dropPrefix oldVal
  newVal = dropPrefix newVal

  [ propertyPrefix, propertyId ] = property.split ':'

  unless propertyPrefix is 'wdt'
    throw error_.newInvalid 'property', propertyPrefix

  oauth = wdOauth.getFullCredentials user

  if newVal?
    if oldVal?
      return updateClaim oauth, id, propertyId, oldVal, newVal
    else
      return addClaim oauth, id, propertyId, newVal
  else
    return removeClaim oauth, id, propertyId, oldVal

addClaim = (oauth, id, propertyId, newVal)->
  wdEdit({ oauth }, 'claim/add')(id, propertyId, newVal)

removeClaim = (oauth, id, propertyId, oldVal)->
  getClaimGuid id, propertyId, oldVal
  .then (guid)-> wdEdit({ oauth }, 'claim/remove')(guid)

updateClaim = (oauth, id, propertyId, oldVal, newVal)->
  removeClaim oauth, id, propertyId, oldVal
  .then -> addClaim oauth, id, propertyId, newVal

getClaimGuid = (id, propertyId, oldVal)->
  getWdEntity [ id ]
  .then (entity)->
    propClaims = entity.claims[propertyId]
    simplifyPropClaims = wdk.simplify.propertyClaims propClaims
    oldValIndex = simplifyPropClaims.indexOf oldVal
    targetClaim = propClaims[oldValIndex]
    return targetClaim.id

dropPrefix = (value)->
  if _.isEntityUri value then value.replace 'wd:', ''
  else value
