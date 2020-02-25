const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')

// Working around circular dependencies
let getEntityByUri, entities_
const lateRequire = () => {
  getEntityByUri = require('./get_entity_by_uri')
  entities_ = require('./entities')
}
setTimeout(lateRequire, 0)

const properties = require('./properties/properties_values_constraints')
const validateClaimValueSync = require('./validate_claim_value_sync')

module.exports = async params => {
  const { type, currentClaims, property, oldVal, newVal, letEmptyValuePass, userIsAdmin } = params
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

  // If the property expects a uniqueValue and that there is already a value defined
  // any action other than editing the current value should be rejected
  if (prop.uniqueValue) {
    const propArray = currentClaims[property]
    if (propArray && propArray.length > 0 && oldVal !== propArray[0]) {
      throw error_.new('this property accepts only one value', 400, params)
    }
  }

  const formattedValue = prop.format != null ? prop.format(newVal) : newVal

  const { concurrency, restrictedType } = prop

  // Resolve only if all async tests pass
  return Promise.all([
    verifyClaimConcurrency(concurrency, property, formattedValue),
    verifyClaimEntityType(restrictedType, formattedValue)
  ])
  .then(() => formattedValue)
}

// For properties that don't tolerate having several entities
// sharing the same value
const verifyClaimConcurrency = (concurrency, property, value) => {
  if (!concurrency) return
  return entities_.byClaim(property, value)
  .then(res => {
    if (res.rows.length > 0) {
      // /!\ The client relies on this exact message
      // client/app/modules/entities/lib/creation_partials.js
      const message = 'this property value is already used'
      const entity = `inv:${res.rows[0].id}`
      // /!\ The client relies on the entity being passed in the context
      throw error_.new(message, 400, { entity, property, value })
    }
  })
}

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
