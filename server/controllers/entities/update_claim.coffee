__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'
radio = __.require 'lib', 'radio'
Entity = __.require 'models', 'entity'
getEntityType = require './lib/get_entity_type'
validateClaimProperty = require './lib/validate_claim_property'
promises_ = __.require 'lib', 'promises'
require('./lib/update_claims_hooks')()

module.exports = (req, res)->
  { id:entityId, property, 'old-value':oldVal, 'new-value': newVal } = req.body
  { _id:userId, admin:userIsAdmin } = req.user

  _.log req.body, 'update claim input'

  unless entityId? then return error_.bundleMissingBody req, res, 'id'
  unless property? then return error_.bundleMissingBody req, res, 'property'
  unless oldVal? or newVal?
    return error_.bundleMissingBody req, res, 'old-value|new-value'

  # An empty string is interpreted as a null value
  oldVal = parseEmptyValue oldVal
  newVal = parseEmptyValue newVal

  entities_.byId entityId
  .then (currentDoc)->
    type = getEntityType currentDoc.claims['wdt:P31']
    validateClaimProperty type, property
    updateClaim { property, oldVal, newVal, userId, currentDoc, userIsAdmin }
  .tap _.Ok(res)
  .then (updatedDoc)->
    radio.emit 'entity:update:claim', updatedDoc, property, oldVal, newVal
  .catch error_.Handler(req, res)

parseEmptyValue = (value)-> if value is '' then null else value

updateClaim = (params)->
  { property, oldVal, userId, currentDoc } = params
  updatedDoc = _.cloneDeep currentDoc
  params.currentClaims = currentDoc.claims
  params.letEmptyValuePass = true

  entities_.validateClaim params
  .then Entity.updateClaim.bind(null, updatedDoc, property, oldVal)
  .then entities_.putUpdate.bind(null, userId, currentDoc)
