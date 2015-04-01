CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
{EntityUri, ItemId} = require './tests/common-tests'
items_ = __.require 'lib', 'items'
Promise = require 'bluebird'
error_ = __.require 'lib', 'error/error'


module.exports = Item = {}

Item.tests = tests = require './tests/item'
Item.attributes = attributes = require './attributes/item'
{ assertValid, solveConstraint } = require('./helpers')(tests, attributes)

Item.create = (userId, item)->
  _.types arguments, ['string', 'object']
  # we want to get couchdb sequential id
  # so we need to let _id blank
  item = _.omit item, '_id'

  {title, entity} = item
  assertValid 'title', title
  assertValid 'entity', entity

  assertValid 'userId', userId
  item.owner = userId

  item.created = _.now()
  item.listing = solveConstraint item, 'listing'
  item.transaction = solveConstraint item, 'transaction'
  return item

Item.update = (userId, item)->
  _.types arguments, ['string', 'object']
  {_id} = item
  assertValid '_id', _id
  return item


Item.updater = (userId, item, doc)->
  unless doc?.owner is userId
    throw new Error  "user isnt doc.owner: #{userId} / #{doc.owner}"

  doc.updated = _.now()
  newData = _.pick item, attributes.updatable
  return _.extend doc, newData
