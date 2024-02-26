import { propertiesPerType } from '#controllers/entities/lib/properties/properties'
import { error_ } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { validateProperty } from './properties/validations.js'

export default (type, property) => {
  assert_.strings([ type, property ])

  validateProperty(property)

  if (!propertiesPerType[type].includes(property)) {
    throw error_.new(`${type}s can't have a property ${property}`, 400, { type, property })
  }
}
