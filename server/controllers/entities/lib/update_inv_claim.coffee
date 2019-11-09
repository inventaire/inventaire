__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
entities_ = require './entities'
radio = __.require 'lib', 'radio'
retryOnConflict = __.require 'lib', 'retry_on_conflict'
Entity = __.require 'models', 'entity'
{ inv: getEntityType } = require './get_entity_type'
validateClaim = require './validate_claim'
validateClaimProperty = require './validate_claim_property'
inferredClaimUpdates = require './inferred_claim_updates'

updateInvClaim = (user, id, property, oldVal, newVal)->
  assert_.object user
  { _id:userId, admin:userIsAdmin } = user

  entities_.byId id
  .then (currentDoc)->
    unless currentDoc?
      throw error_.new 'entity not found', 400, { id, property, oldVal, newVal }

    # Known cases: entities turned into redirections or removed:placeholders
    unless currentDoc?.claims?
      context = { id, property, oldVal, newVal }
      throw error_.new 'this entity is obsolete', 400, context

    type = getEntityType currentDoc.claims
    validateClaimProperty type, property
    updateClaim { type, property, oldVal, newVal, userId, currentDoc, userIsAdmin }

  .then (updatedDoc)->
    radio.emit 'entity:update:claim', updatedDoc, property, oldVal, newVal
    # Wait for inferred updates
    return inferredClaimUpdates updatedDoc, property, oldVal

updateClaim = (params)->
  { property, oldVal, userId, currentDoc } = params
  updatedDoc = _.cloneDeep currentDoc
  params.currentClaims = currentDoc.claims
  params.letEmptyValuePass = true

  validateClaim params
  .then Entity.updateClaim.bind(null, updatedDoc, property, oldVal)
  .then (updatedDoc)-> entities_.putUpdate { userId, currentDoc, updatedDoc }

module.exports = retryOnConflict { updateFn: updateInvClaim }
