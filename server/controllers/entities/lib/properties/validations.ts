import { isPropertyUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { objectKeys, typeOf } from '#lib/utils/types'
import type { PropertyUri } from '#server/types/entity'
import { propertiesValuesConstraints as properties } from './properties_values_constraints.js'

const allowlist = objectKeys(properties)
const allowset = new Set(allowlist)

export function validateProperty (property): asserts property is keyof typeof properties {
  if (!isPropertyUri(property)) {
    throw newError('invalid property', 400, property)
  }

  // @ts-expect-error TS2345
  if (!allowset.has(property)) {
    throw newError("property isn't allowlisted", 400, { property, allowlist })
  }
}

export function validateValueType (property: PropertyUri, value: unknown) {
  return typeOf(value) === properties[property].primitiveType
}
