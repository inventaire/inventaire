import _ from '#builders/utils'
import error_ from '#lib/error/error'
import properties from './properties_values_constraints.js'

const allowlist = Object.keys(properties)
const allowset = new Set(allowlist)

// Which type a property value should return when passed to _.typeOf
const propertyType = property => properties[property].type || properties[property].datatype

export default {
  propertyType,

  validateProperty: property => {
    if (!/^(wdt|invp):P\d+$/.test(property)) {
      throw error_.new('invalid property', 400, property)
    }

    if (!allowset.has(property)) {
      throw error_.new("property isn't allowlisted", 400, { property, allowlist })
    }
  },

  validateValueType: (property, value) => {
    return _.typeOf(value) === propertyType(property)
  }
}
