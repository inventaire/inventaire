import _ from '#builders/utils'
import error_ from '#lib/error/error'
import assert_ from '#lib/utils/assert_types'
import validateAndFormatClaim from './validate_and_format_claim.js'
import getEntityType from './get_entity_type.js'
import validateClaimProperty from './validate_claim_property.js'

export default async ({ claims, type, _id }) => {
  const wdtP31 = claims['wdt:P31']
  type = wdtP31 ? getEntityType(wdtP31) : type
  assert_.string(type)

  if (!_.isNonEmptyPlainObject(claims)) {
    throw error_.new('invalid claims', 400, { claims })
  }

  await Promise.all(validatePropertiesClaims(claims, type, _id))

  // Returning validated and formatted claims on the mutated object
  return claims
}

const validatePropertiesClaims = (claims, type, _id) => {
  const properties = Object.keys(claims)
  return properties.map(validatePropertyClaims(claims, type, _id))
}

const validatePropertyClaims = (claims, type, _id) => async property => {
  validateClaimProperty(type, property)
  let values = claims[property]

  if (!_.isArray(values)) {
    throw error_.new('invalid property value array', 400, {
      property,
      values,
      type: _.typeOf(values),
      expectedType: 'array'
    })
  }

  values = _.uniq(values)

  claims[property] = await Promise.all(values.map(newVal => validateAndFormatClaim({
    type,
    property,
    oldVal: null,
    newVal,
    letEmptyValuePass: false,
    _id,
  })))
}
