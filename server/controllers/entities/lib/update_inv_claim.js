const _ = require('builders/utils')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const entities_ = require('./entities')
const radio = require('lib/radio')
const retryOnConflict = require('lib/retry_on_conflict')
const Entity = require('models/entity')
const getEntityType = require('./get_entity_type')
const validateAndFormatClaim = require('./validate_and_format_claim')
const validateClaimProperty = require('./validate_claim_property')
const inferredClaimUpdates = require('./inferred_claim_updates')

const updateInvClaim = (user, id, property, oldVal, newVal) => {
  assert_.object(user)
  const { _id: userId, admin: userIsAdmin } = user
  return entities_.byId(id)
  .catch(err => {
    if (err.statusCode === 404) {
      throw error_.new('entity not found', 400, { id, property, oldVal, newVal })
    }
  })
  .then(currentDoc => {
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

const updateClaim = async params => {
  const { property, oldVal, userId, currentDoc } = params
  params.letEmptyValuePass = true
  const formattedNewVal = await validateAndFormatClaim(params)
  const updatedDoc = Entity.updateClaim(_.cloneDeep(currentDoc), property, oldVal, formattedNewVal)
  return entities_.putUpdate({ userId, currentDoc, updatedDoc })
}

module.exports = retryOnConflict({ updateFn: updateInvClaim })
