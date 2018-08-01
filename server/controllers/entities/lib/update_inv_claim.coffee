__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
radio = __.require 'lib', 'radio'
retryOnConflict = __.require 'lib', 'retry_on_conflict'
Entity = __.require 'models', 'entity'
getEntityType = require './get_entity_type'
validateClaimProperty = require './validate_claim_property'
inferredClaimUpdates = require './inferred_claim_updates'

updateInvClaim = (user, id, property, oldVal, newVal)->
  _.type user, 'object'
  { _id:userId, admin:userIsAdmin } = user

  entities_.byId id
  .then (currentDoc)->
    unless currentDoc?
      throw error_.new 'entity not found', 400, { id, property, oldVal, newVal }

    # Known cases: entities turned into redirections or removed:placeholders
    unless currentDoc?.claims?
      context = { id, property, oldVal, newVal }
      throw error_.new 'this entity is obsolete', 400, context

    type = getEntityType currentDoc.claims['wdt:P31']
    validateClaimProperty type, property
    updateClaim { property, oldVal, newVal, userId, currentDoc, userIsAdmin }

  .then (updatedDoc)->
    radio.emit 'entity:update:claim', updatedDoc, property, oldVal, newVal
    # Wait for inferred updates
    return inferredClaimUpdates updatedDoc, property, oldVal

updateClaim = (params)->
  { property, oldVal, userId, currentDoc } = params
  updatedDoc = _.cloneDeep currentDoc
  params.currentClaims = currentDoc.claims
  params.letEmptyValuePass = true

  entities_.validateClaim params
  .then Entity.updateClaim.bind(null, updatedDoc, property, oldVal)
  .then (updatedDoc)-> entities_.putUpdate { userId, currentDoc, updatedDoc }

module.exports = retryOnConflict updateInvClaim
