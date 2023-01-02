import { error_ } from '#lib/error/error'
import { typeOf } from '#lib/utils/types'
import properties from './properties_values_constraints.js'

const allowlist = Object.keys(properties)
const allowset = new Set(allowlist)

// Which type a property value should return when passed to typeOf
export const propertyType = property => properties[property].type || properties[property].datatype

export const validateProperty = property => {
  if (!/^(wdt|invp):P\d+$/.test(property)) {
    throw error_.new('invalid property', 400, property)
  }

  if (!allowset.has(property)) {
    throw error_.new("property isn't allowlisted", 400, { property, allowlist })
  }
}

export const validateValueType = (property, value) => {
  return typeOf(value) === propertyType(property)
}
