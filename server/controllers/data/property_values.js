const error_ = require('lib/error/error')
const { typesNames } = require('lib/wikidata/aliases')
const allowedValuesPerTypePerProperty = require('controllers/entities/lib/properties/allowed_values_per_type_per_property')

const sanitization = {
  property: {
    allowlist: Object.keys(allowedValuesPerTypePerProperty)
  },
  type: {
    allowlist: typesNames
  }
}

const getAllowedValues = ({ property, type }) => {
  const allowedValuesPerType = allowedValuesPerTypePerProperty[property]
  if (!allowedValuesPerType[type]) {
    throw error_.new('unsupported type for this property', 400, { property, type })
  }
  const values = allowedValuesPerType[type]
  return { values }
}

module.exports = { sanitization, controller: getAllowedValues }
