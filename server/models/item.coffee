CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
{EntityUri, ItemId} = require './common-tests'
items_ = __.require 'lib', 'items'
Promise = require 'bluebird'

module.exports =
  create: (userId, item)->
    _.types arguments, ['string', 'object']
    # we want to get couchdb sequential id
    # so we need to let _id blank
    item = _.omit item, '_id'
    assertValidTitle item.title
    assertValidEntity item.entity
    item.created = _.now()
    item.owner = userId
    items_.db.post item

  update: (userId, item)->
    _.types arguments, ['string', 'object']
    {_id} = item
    assertValidId(_id)
    items_.db.update _id, updater.bind(null, userId, item)


assertValidId = (id)->
  assert ItemId.test(id)

assertValidTitle = (id)->
  _.type id, 'string'
  assert id.length > 0

assertValidEntity = (id)->
  assert EntityUri.test(id)

updater = (userId, item, doc)->
  unless doc?.owner is userId
    throw new Error  "user isnt doc.owner: #{userId} / #{doc.owner}"

  doc.updated = _.now()
  newData = _.pick item, updatable
  return _.extend doc, newData

updatable = [
  'transaction'
  'pictures'
  'listing'
  'comment'
  'notes'
]
