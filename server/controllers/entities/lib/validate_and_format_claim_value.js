import { error_ } from '#lib/error/error'
import properties from './properties/properties_values_constraints.js'
import validateClaimValueSync from './validate_claim_value_sync.js'

let getEntityByUri, getEntitiesByClaim
const importCircularDependencies = async () => {
  ;({ getEntityByUri } = await import('./get_entity_by_uri.js'))
  ;({ getEntitiesByClaim } = await import('./entities.js'))
}
setImmediate(importCircularDependencies)

export default async params => {
  const { type, property, oldVal, newVal, letEmptyValuePass, userIsAdmin, _id } = params
  // letEmptyValuePass to let it be interpreted as a claim deletion
  if (letEmptyValuePass && newVal == null) return null

  const prop = properties[property]

  // If no old value is passed, it's a claim creation, not an update
  const updatingValue = (oldVal != null)

  // Ex: a user can freely set a wdt:P31 value, but only an admin can change it
  if (updatingValue && prop.adminUpdateOnly && !userIsAdmin) {
    throw error_.new("updating property requires admin's rights", 403, property, newVal)
  }

  validateClaimValueSync(property, newVal, type)

  const formattedValue = prop.format != null ? prop.format(newVal) : newVal

  const { concurrency, restrictedType } = prop

  await Promise.all([
    verifyClaimConcurrency(concurrency, property, formattedValue, _id),
    verifyClaimEntityType(restrictedType, formattedValue),
  ])

  return formattedValue
}

// For properties that don't tolerate having several entities
// sharing the same value
const verifyClaimConcurrency = async (concurrency, property, value, _id) => {
  if (!concurrency) return

  let { rows } = await getEntitiesByClaim(property, value)

  rows = rows.filter(isntCurrentlyValidatedEntity(_id))

  if (rows.length > 0) {
    // /!\ The client relies on this exact message
    // client/app/modules/entities/lib/creation_partials.js
    const message = 'this property value is already used'
    const entity = `inv:${rows[0].id}`
    // /!\ The client relies on the entity being passed in the context
    throw error_.new(message, 400, { entity, property, value })
  }
}

const isntCurrentlyValidatedEntity = _id => row => row.id !== _id

// For claims that have an entity URI as value
// check that the target entity is of the expected type
const verifyClaimEntityType = async (restrictedType, value) => {
  if (restrictedType == null) return

  const entity = await getEntityByUri({ uri: value })

  if (!entity) {
    throw error_.new('entity not found', 400, value)
  }

  if (entity.type !== restrictedType) {
    throw error_.new(`invalid claim entity type: ${entity.type}`, 400, value)
  }
}
