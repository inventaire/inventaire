import error_ from 'lib/error/error'
import { validateProperty } from './properties/validations'
import propertiesPerType from 'controllers/entities/lib/properties/properties_per_type'
import assert_ from 'lib/utils/assert_types'

export default (type, property) => {
  assert_.strings([ type, property ])

  validateProperty(property)

  if (!propertiesPerType[type].includes(property)) {
    throw error_.new(`${type}s can't have a property ${property}`, 400, { type, property })
  }
}
