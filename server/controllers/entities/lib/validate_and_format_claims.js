const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const validateAndFormatClaim = require('./validate_and_format_claim')
const getEntityType = require('./get_entity_type')
const validateClaimProperty = require('./validate_claim_property')

module.exports = async (claims, type) => {
  const wdtP31 = claims['wdt:P31']
  type = wdtP31 ? getEntityType(wdtP31) : type
  assert_.string(type)

  if (!_.isNonEmptyPlainObject(claims)) {
    throw error_.new('invalid claims', 400, { claims })
  }

  await Promise.all(validatePropertiesClaims(claims, type))

  // Returning validated and formatted claims on the mutated object
  return claims
}

const validatePropertiesClaims = (claims, type) => {
  const properties = Object.keys(claims)
  return properties.map(validatePropertyClaims(claims, type))
}

const validatePropertyClaims = (claims, type) => async property => {
  validateClaimProperty(type, property)
  let values = claims[property]

  if (!_.isArray(values)) {
    throw error_.new('invalid property values', 400, { property, values })
  }

  values = _.uniq(values)

  claims[property] = await Promise.all(values.map(newVal => validateAndFormatClaim({
    type,
    property,
    oldVal: null,
    newVal,
    letEmptyValuePass: false
  })))
}
