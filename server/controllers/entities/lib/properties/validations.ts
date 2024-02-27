import { isPropertyUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { typeOf } from '#lib/utils/types'
import { propertiesValuesConstraints as properties } from './properties_values_constraints.js'

const allowlist = Object.keys(properties)
const allowset = new Set(allowlist)

export function validateProperty (property) {
  if (!isPropertyUri(property)) {
    throw newError('invalid property', 400, property)
  }

  if (!allowset.has(property)) {
    throw newError("property isn't allowlisted", 400, { property, allowlist })
  }
}

export function validateValueType (property, value) {
  return typeOf(value) === properties[property].primitiveType
}
