const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const entities_ = require('./entities')
const radio = __.require('lib', 'radio')
const retryOnConflict = __.require('lib', 'retry_on_conflict')
const Entity = __.require('models', 'entity')
const getEntityType = require('./get_entity_type')
const validateClaim = require('./validate_claim')
const validateClaimProperty = require('./validate_claim_property')
const inferredClaimUpdates = require('./inferred_claim_updates')

const updateInvClaim = (user, id, property, oldVal, newVal) => {
  assert_.object(user)
  const { _id: userId, admin: userIsAdmin } = user

  return entities_.byId(id)
  .then(currentDoc => {
    if (currentDoc == null) {
      throw error_.new('entity not found', 400, { id, property, oldVal, newVal })
    }

    // Known cases: entities turned into redirections or removed:placeholders
    if (currentDoc.claims == null) {
      const context = { id, property, oldVal, newVal }
      throw error_.new('this entity is obsolete', 400, context)
    }

    const type = getEntityType(currentDoc.claims['wdt:P31'])
    validateClaimProperty(type, property)
    return updateClaim({ type, property, oldVal, newVal, userId, currentDoc, userIsAdmin })
  })

  .then(updatedDoc => {
    radio.emit('entity:update:claim', updatedDoc, property, oldVal, newVal)
    // Wait for inferred updates
    return inferredClaimUpdates(updatedDoc, property, oldVal)
  })
}

const updateClaim = params => {
  const { property, oldVal, userId, currentDoc } = params
  const updatedDoc = _.cloneDeep(currentDoc)
  params.currentClaims = currentDoc.claims
  params.letEmptyValuePass = true

  return validateClaim(params)
  .then(Entity.updateClaim.bind(null, updatedDoc, property, oldVal))
  .then(updatedDoc => entities_.putUpdate({ userId, currentDoc, updatedDoc }))
}

module.exports = retryOnConflict({ updateFn: updateInvClaim })
