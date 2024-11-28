import { propertiesPerType } from '#controllers/entities/lib/properties/properties'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import type { EntityType, PropertyUri } from '#types/entity'
import { validateProperty } from './properties/validations.js'

export function validateClaimProperty (type: EntityType, property: PropertyUri) {
  assert_.strings([ type, property ])

  validateProperty(property)

  if (!propertiesPerType[type].includes(property)) {
    throw newError(`${type}s can't have a property ${property}`, 400, { type, property })
  }
}
