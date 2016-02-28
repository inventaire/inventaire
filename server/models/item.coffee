CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Item = {}

Item.tests = tests = require './tests/item'
Item.attributes = attributes = require './attributes/item'
{ solveConstraint } = require('./helpers')(attributes)

Item.create = (userId, item)->
  _.types arguments, ['string', 'object']
  # we want to get couchdb sequential id
  # so we need to let _id blank
  item = _.omit item, '_id'

  {title, entity, pictures} = item
  tests.pass 'title', title
  tests.pass 'entity', entity

  tests.pass 'userId', userId
  item.owner = userId

  item.pictures = pictures or= []
  tests.pass 'pictures', pictures

  item.created = _.now()
  item.listing = solveConstraint item, 'listing'
  item.transaction = solveConstraint item, 'transaction'
  return item

Item.update = (userId, item)->
  _.types arguments, ['string', 'object']
  tests.pass 'itemId', item._id

  unknown = _.difference Object.keys(item), attributes.known
  if unknown.length > 0
    throw error_.new "unknown attribute(s): #{unknown}", 400

  # just testing updatable attributes
  # as non-updatable will be filtered-out at Item.updater
  for attr in attributes.updatable
    passAttrTest item, attr

  return item

passAttrTest = (item, attr)->
  if item[attr]? then tests.pass attr, item[attr]

Item.updater = (userId, item, doc)->
  unless doc?.owner is userId
    throw new Error "user isnt doc.owner: #{userId} / #{doc.owner}"

  doc.updated = _.now()
  # filtered out non-updatable attributes
  newData = _.pick item, attributes.updatable
  return _.extend doc, newData

Item.changeOwner = (transacDoc, item)->
  _.types arguments, 'objects...'
  _.log arguments, 'changeOwner'

  item = _.omit item, attributes.reset
  _.log item, 'item without reset attributes'

  { _id: transacId, owner, requester } = transacDoc

  unless item.owner is owner
    throw new Error "owner doesn't match item owner"

  item.history or= []
  item.history.push
    transaction: transacId
    previousOwner: owner
    timestamp: _.now()

  _.log item.history, 'updated history'

  _.extend item,
    owner: requester
    # default values
    transaction: 'inventorying'
    listing: 'private'
    updated: _.now()

Item.allowTransaction = (item)->
  item.transaction in attributes.allowTransaction
