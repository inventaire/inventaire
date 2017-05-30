__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './lib/entities'
radio = __.require 'lib', 'radio'
Entity = __.require 'models', 'entity'
getEntityType = require './lib/get_entity_type'
validateClaimProperty = require './lib/validate_claim_property'

updateInvClaim = (user, id, property, oldVal, newVal)->
  { _id:userId, admin:userIsAdmin } = user
  entities_.byId id
  .then (currentDoc)->
    type = getEntityType currentDoc.claims['wdt:P31']
    validateClaimProperty type, property
    updateClaim { property, oldVal, newVal, userId, currentDoc, userIsAdmin }
  .then (updatedDoc)->
    radio.emit 'entity:update:claim', updatedDoc, property, oldVal, newVal

updateClaim = (params)->
  { property, oldVal, userId, currentDoc } = params
  updatedDoc = _.cloneDeep currentDoc
  params.currentClaims = currentDoc.claims
  params.letEmptyValuePass = true

  entities_.validateClaim params
  .then Entity.updateClaim.bind(null, updatedDoc, property, oldVal)
  .then entities_.putUpdate.bind(null, userId, currentDoc)
