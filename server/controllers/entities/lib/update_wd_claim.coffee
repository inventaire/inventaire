CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
getWdEntity = __.require 'data', 'wikidata/get_entity'
wdk = require 'wikidata-sdk'
wdEdit = require 'wikidata-edit'
{ properties } = require './properties'
{ wikidataOAuth } = CONFIG

module.exports = (user, id, property, oldVal, newVal)->
  { oauth } = user
  userWikidataOAuth = user.oauth?.wikidata
  unless userWikidataOAuth?
    return error_.reject 'missing wikidata oauth tokens', 400

  if properties[property].datatype is 'entity' and _.isInvEntityUri newVal
    return error_.reject "wikidata entities can't link to inventaire entities", 400

  oldVal = dropPrefix oldVal
  newVal = dropPrefix newVal

  [ propertyPrefix, propertyId ] = property.split ':'

  unless propertyPrefix is 'wdt'
    return error_.rejectInvalid 'property', propertyPrefix

  oauth = _.extend userWikidataOAuth, wikidataOAuth

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
