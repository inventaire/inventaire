import { isPropertyUri } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { typeOf } from '#lib/utils/types'
import { propertiesValuesConstraints as properties } from './properties_values_constraints.js'

const allowlist = Object.keys(properties)
const allowset = new Set(allowlist)

export const validateProperty = property => {
  if (!isPropertyUri(property)) {
    throw error_.new('invalid property', 400, property)
  }

  if (!allowset.has(property)) {
    throw error_.new("property isn't allowlisted", 400, { property, allowlist })
  }
}

export const validateValueType = (property, value) => {
  return typeOf(value) === properties[property].primitiveType
}
