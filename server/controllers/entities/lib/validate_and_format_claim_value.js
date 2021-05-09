const error_ = require('lib/error/error')

let getEntityByUri, entities_
const requireCircularDependencies = () => {
  getEntityByUri = require('./get_entity_by_uri')
  entities_ = require('./entities')
}
setImmediate(requireCircularDependencies)

const properties = require('./properties/properties_values_constraints')
const validateClaimValueSync = require('./validate_claim_value_sync')

module.exports = async params => {
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
    verifyClaimEntityType(restrictedType, formattedValue)
  ])

  return formattedValue
}

// For properties that don't tolerate having several entities
// sharing the same value
const verifyClaimConcurrency = async (concurrency, property, value, _id) => {
  if (!concurrency) return

  let { rows } = await entities_.byClaim(property, value)

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
const verifyClaimEntityType = (restrictedType, value) => {
  if (restrictedType == null) return

  return getEntityByUri({ uri: value })
  .then(entity => {
    if (entity.type !== restrictedType) {
      throw error_.new(`invalid claim entity type: ${entity.type}`, 400, value)
    }
  })
}
