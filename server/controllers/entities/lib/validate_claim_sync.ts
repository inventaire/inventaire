import { isEntityId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { typeOf } from '#lib/utils/types'
import { getClaimValue } from '#models/entity'
import type { EntityType, InvClaim, InvClaimValue, PropertyUri } from '#types/entity'
import { propertiesValuesConstraints as properties } from './properties/properties_values_constraints.js'
import { validateValueType } from './properties/validations.js'

export function validateClaimValueSync (property: PropertyUri, value: InvClaimValue, entityType: EntityType) {
  if (!validateValueType(property, value)) {
    const expected = properties[property].primitiveType
    const actual = typeOf(value)
    const message = `invalid value type: expected ${expected}, got ${actual}`
    throw newError(message, 400, { property, value })
  }

  const { datatype, typeSpecificValidation, validate, format } = properties[property]

  if (format) {
    value = format(value)
  }

  if (typeSpecificValidation) {
    if (!validate({ value, entityType })) {
      const message = `invalid property value for entity type "${entityType}"`
      throw newError(message, 400, { entityType, property, value })
    }
  } else {
    if (!validate({ value, entityType })) {
      if (datatype === 'entity' && isEntityId(value)) {
        throw newError('invalid property value: missing entity uri prefix', 400, { property, value })
      } else {
        throw newError('invalid property value', 400, { property, value })
      }
    }
  }
}

export function validateClaimSync (property: PropertyUri, claim: InvClaim, entityType: EntityType) {
  const value = getClaimValue(claim)
  validateClaimValueSync(property, value, entityType)
}
