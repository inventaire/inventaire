CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
assert = require 'assert'
items_ = __.require 'lib', 'items'
Promise = require 'bluebird'
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
  # just testing updatable attributes
  # as non-updatable will be filtered-out at Item.updater
  attributes.updatable.forEach _.partial(passAttrTest, item)

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

Item.fork = (data={}, item)->
  {owner, transaction, listing} = data

  tests.pass 'userId', owner

  copy = _.pick item, attributes.forkable
  _.extend copy,
    owner: owner
    transaction: transaction or 'inventorying'
    listing: listing or 'private'
    forkedFrom: item._id
    created: _.now()
