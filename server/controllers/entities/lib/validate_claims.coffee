__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
validateClaim = require './validate_claim'
getEntityType = require './get_entity_type'
validateClaimProperty = require './validate_claim_property'

module.exports = (params)->
  { newClaims, currentClaims, creating } = params
  wdtP31 = currentClaims['wdt:P31'] or newClaims['wdt:P31']
  type = getEntityType wdtP31

  unless _.isNonEmptyPlainObject newClaims
    throw error_.new 'invalid claims', 400, { newClaims }

  unless _.isPlainObject currentClaims
    throw error_.new 'invalid claims', 400, { currentClaims }

  typeTestFn = perTypeClaimsTests[type] or _.noop
  typeTestFn newClaims, creating

  propertiesClaimsValidation = validatePropertiesClaims newClaims, currentClaims, type
  promises_.all _.flatten(propertiesClaimsValidation)

validatePropertiesClaims = (newClaims, currentClaims, type)->
  Object.keys newClaims
  .map validatePropertyClaims(newClaims, currentClaims, type)

validatePropertyClaims = (newClaims, currentClaims, type)-> (property)->
  validateClaimProperty type, property
  values = newClaims[property]
  unless _.isArray values
    throw error_.new 'invalid property values', 400, { property, values }
  newClaims[property] = values = _.uniq values
  values.map (newVal)->
    params = { currentClaims, property, oldVal: null, newVal, letEmptyValuePass: false }
    return validateClaim params

perTypeClaimsTests =
  edition: (newClaims, creating)->
    unless creating then return
    entityLabel = 'an edition'
    assertPropertyHasValue newClaims, 'wdt:P629', entityLabel, 'an associated work'
    assertPropertyHasValue newClaims, 'wdt:P1476', entityLabel, 'a title'
    return

assertPropertyHasValue = (claims, property, entityLabel, propertyLabel)->
  unless claims[property]?[0]?
    message = "#{entityLabel} should have #{propertyLabel} (#{property})"
    throw error_.new message, 400, claims

  return
