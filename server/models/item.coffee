CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Item = {}

Item.validations = validations = require './validations/item'
Item.attributes = attributes = require './attributes/item'
{ solveConstraint } = require('./helpers')(attributes)

Item.create = (userId, item)->
  _.types arguments, ['string', 'object']
  # _id: We want to get couchdb sequential id so we need to let _id blank
  # owner: ignore any passed owner, the owner is the authentified user
  # created: ignore what the client may say, it will be re-set here
  item = _.omit item, ['_id', 'owner', 'created']
  passedAttributes = Object.keys item

  item.pictures or= []
  item.listing = solveConstraint item, 'listing'
  item.transaction = solveConstraint item, 'transaction'

  for attr in passedAttributes
    unless attr in attributes.validAtCreation
      throw error_.new "invalid attribute: #{attr}", 400, arguments

    validations.pass attr, item[attr]

  validations.pass 'userId', userId

  item.owner = userId
  item.created = Date.now()
  return item

passAttrTest = (item, attr)->
  if item[attr]? then validations.pass attr, item[attr]

Item.update = (userId, updateAttributesData, doc)->
  unless doc?.owner is userId
    throw new Error "user isnt doc.owner: #{userId} / #{doc.owner}"

  nonUpdatedAttributes = _.omit updateAttributesData, attributes.known
  if Object.keys(nonUpdatedAttributes).length > 0
    nonUpdatedAttributesStr = JSON.stringify nonUpdatedAttributes
    throw error_.new "invalid attribute(s): #{nonUpdatedAttributesStr}", 400

  # filter-out non-updatable attributes
  newData = _.pick updateAttributesData, attributes.updatable

  for attr in attributes.updatable
    passAttrTest updateAttributesData, attr

  updatedDoc = _.extend {}, doc, newData
  updatedDoc.updated = Date.now()
  return updatedDoc

Item.changeOwner = (transacDoc, item)->
  _.types arguments, 'objects...'
  _.log arguments, 'changeOwner'

  item = _.omit item, attributes.reset
  _.log item, 'item without reset attributes'

  { _id: transacId, owner, requester } = transacDoc

  unless item.owner is owner
    throw new Error "owner doesn't match item owner"

  item.history or= []
  item.history.push
    transaction: transacId
    previousOwner: owner
    timestamp: Date.now()

  _.log item.history, 'updated history'

  _.extend item,
    owner: requester
    # default values
    transaction: 'inventorying'
    listing: 'private'
    updated: Date.now()

Item.allowTransaction = (item)->
  item.transaction in attributes.allowTransaction

Item.updateEntity = (fromUri, toUri, item)->
  unless item.entity is fromUri
    throw error_.new "wrong entity uri: expected #{fromUri}, got #{item.entity}", 500

  item.entity = toUri
  # Keeping track of previous entity URI in case a rollback is needed
  item.previousEntity or= []
  item.previousEntity.unshift fromUri

  return item

Item.revertEntity = (fromUri, toUri, item)->
  { entity } = item
  previousEntity = item.previousEntity[0]
  unless item.entity is toUri
    throw error_.new "wrong entity uri: expected #{entity}, got #{toUri}", 500

  unless fromUri is previousEntity
    message = "wrong previous entity: expected #{previousEntity}, got #{fromUri}"
    throw error_.new message, 500

  item.entity = previousEntity
  item.previousEntity.shift()

  return item
