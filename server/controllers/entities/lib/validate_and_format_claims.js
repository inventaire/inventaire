import _ from '#builders/utils'
import { error_ } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { typeOf } from '#lib/utils/types'
import getEntityType from './get_entity_type.js'
import validateAndFormatClaim from './validate_and_format_claim.js'
import validateClaimProperty from './validate_claim_property.js'

export default async ({ claims, type, _id }) => {
  const wdtP31 = claims['wdt:P31']
  type = wdtP31 ? getEntityType(wdtP31) : type
  assert_.string(type)

  if (!_.isNonEmptyPlainObject(claims)) {
    throw error_.new('invalid claims', 400, { claims })
  }

  await validatePropertiesClaims(claims, type, _id)

  // Returning validated and formatted claims on the mutated object
  return claims
}

const validatePropertiesClaims = (claims, type, _id) => {
  const properties = Object.keys(claims)
  return Promise.all(properties.map(validatePropertyClaims(claims, type, _id)))
}

const validatePropertyClaims = (claims, type, _id) => async property => {
  let values = claims[property]

  if (!_.isArray(values)) {
    throw error_.new('invalid property value array', 400, {
      property,
      values,
      type: typeOf(values),
      expectedType: 'array',
    })
  }

  if (values.length === 0) {
    delete claims[property]
    return
  }

  validateClaimProperty(type, property)

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
