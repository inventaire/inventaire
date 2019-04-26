CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'

module.exports = Item = {}

Item.validations = validations = require './validations/item'
Item.attributes = attributes = require './attributes/item'
{ solveConstraint } = require('./helpers')(attributes)

Item.create = (userId, item)->
  assert_.types ['string', 'object'], [ userId, item ]
  # _id: We want to get couchdb sequential id so we need to let _id blank
  # owner: ignore any passed owner, the owner is the authentified user
  # created: ignore what the client may say, it will be re-set here
  item = _.omit item, ['_id', 'owner', 'created']
  passedAttributes = Object.keys item

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

Item.update = (userId, newAttributes, oldItem)->
  assert_.types [ 'string', 'object', 'object' ], arguments

  unless oldItem.owner is userId
    throw error_.new "user isnt item.owner: #{userId}", 400, oldItem.owner

  newItem = _.clone oldItem

  newAttributes = _.omit newAttributes, attributes.notUpdatable

  passedAttributes = Object.keys newAttributes

  for attr in passedAttributes
    unless attr in attributes.updatable
      throw error_.new "invalid attribute: #{attr}", 400, arguments
    newVal = newAttributes[attr]
    validations.pass attr, newVal
    newItem[attr] = newVal

  now = Date.now()
  newItem.updated = now
  return newItem

Item.changeOwner = (transacDoc, item)->
  assert_.objects [ transacDoc, item ]
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
