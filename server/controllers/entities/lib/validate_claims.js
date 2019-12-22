const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')
const validateClaim = require('./validate_claim')
const getEntityType = require('./get_entity_type')
const validateClaimProperty = require('./validate_claim_property')

module.exports = params => {
  const { newClaims, currentClaims, creating } = params
  const wdtP31 = currentClaims['wdt:P31'] || newClaims['wdt:P31']
  const type = params.type = getEntityType(wdtP31)

  if (!_.isNonEmptyPlainObject(newClaims)) {
    throw error_.new('invalid claims', 400, { newClaims })
  }

  if (!_.isPlainObject(currentClaims)) {
    throw error_.new('invalid claims', 400, { currentClaims })
  }

  const typeTestFn = perTypeClaimsTests[type] || _.noop
  typeTestFn(newClaims, creating)

  return promises_.all(_.flatten(validatePropertiesClaims(params)))
}

const validatePropertiesClaims = params => {
  return Object.keys(params.newClaims)
  .map(validatePropertyClaims(params))
}

const validatePropertyClaims = params => property => {
  const { newClaims, currentClaims, type } = params
  validateClaimProperty(type, property)
  let values = newClaims[property]

  if (!_.isArray(values)) {
    throw error_.new('invalid property values', 400, { property, values })
  }

  newClaims[property] = (values = _.uniq(values))

  return values.map(newVal => validateClaim({
    type,
    currentClaims,
    property,
    oldVal: null,
    newVal,
    letEmptyValuePass: false
  }))
}

const perTypeClaimsTests = {
  edition: (newClaims, creating) => {
    if (!creating) return
    const entityLabel = 'an edition'
    assertPropertyHasValue(newClaims, 'wdt:P629', entityLabel, 'an associated work')
    assertPropertyHasValue(newClaims, 'wdt:P1476', entityLabel, 'a title')
  }
}

const assertPropertyHasValue = (claims, property, entityLabel, propertyLabel) => {
  if (!(claims[property] && claims[property][0] != null)) {
    const message = `${entityLabel} should have ${propertyLabel} (${property})`
    throw error_.new(message, 400, claims)
  }
}
