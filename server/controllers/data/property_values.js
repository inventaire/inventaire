import error_ from '#lib/error/error'
import { typesNames } from '#lib/wikidata/aliases'
import allowedValuesPerTypePerProperty from '#controllers/entities/lib/properties/allowed_values_per_type_per_property'

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

export default { sanitization, controller: getAllowedValues }
