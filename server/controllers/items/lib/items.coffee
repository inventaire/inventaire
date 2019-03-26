CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
Item = __.require 'models', 'item'
privateAttrs = Item.attributes.private
listingsPossibilities = Item.attributes.constrained.listing.possibilities
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
couch_ = __.require 'lib', 'couch'
promises_ = __.require 'lib', 'promises'
radio = __.require 'lib', 'radio'
{ filterPrivateAttributes } = require './filter_private_attributes'
{ minKey, maxKey } = __.require 'lib', 'couch'
listingsLists = require './listings_lists'
snapshot_ = require './snapshot/snapshot'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
getByAccessLevel = require './get_by_access_level'

# Working around the circular dependency
user_ = null
lateRequire = -> user_ = __.require 'controllers', 'user/lib/user'
setTimeout lateRequire, 0

db = __.require('couch', 'base')('items')

module.exports = items_ =
  db: db
  byId: db.get
  byIds: db.fetch
  byOwner: (ownerId)->
    db.viewCustom 'byOwnerAndEntityAndListing',
      startkey: [ ownerId ]
      endkey: [ ownerId, maxKey, maxKey ]
      include_docs: true

  byEntity: (entityUri)->
    assert_.string entityUri
    db.viewByKeys 'byEntity', entityUriKeys(entityUri)

  byPreviousEntity: (entityUri)-> db.viewByKey 'byPreviousEntity', entityUri

  # all items from an entity that require a specific authorization
  authorizedByEntities: (uris, reqUserId)->
    listingByEntities 'network', uris, reqUserId

  publicByEntities: (uris, reqUserId)->
    listingByEntities 'public', uris, reqUserId

  publicByDate: (limit = 15, offset = 0, assertImage = false, reqUserId)->
    db.viewCustom 'publicByDate',
      limit: limit
      skip: offset
      descending: true
      include_docs: true
    .then FilterWithImage(assertImage)
    .map snapshot_.addToItem
    .map filterPrivateAttributes(reqUserId)

  byOwnersAndEntitiesAndListings: (ownersIds, uris, listingsKey, reqUserId)->
    keys = []
    for ownerId in ownersIds
      for uri in uris
        for listing in listingsLists[listingsKey]
          keys.push [ ownerId, uri, listing ]

    db.viewByKeys 'byOwnerAndEntityAndListing', keys
    .map snapshot_.addToItem
    .map filterPrivateAttributes(reqUserId)

  create: (userId, items)->
    assert_.array items
    promises_.all items.map(validateEntityType)
    .map (item)-> Item.create userId, item
    .then db.bulk
    .then (res)->
      itemsIds = _.map res, 'id'
      db.fetch itemsIds
      .tap -> radio.emit 'user:inventory:update', userId

  update: (userId, itemUpdateData)->
    db.get itemUpdateData._id
    .then (currentItem)-> Item.update(userId, itemUpdateData, currentItem)
    .then db.putAndReturn
    .tap -> radio.emit 'user:inventory:update', userId

  bulkUpdate: (userId, ids, attribute, newValue)->
    itemUpdateData = {}
    itemUpdateData[attribute] = newValue
    items_.byIds ids
    .map (currentItem)-> Item.update(userId, itemUpdateData, currentItem)
    .then db.bulk
    .tap -> radio.emit 'user:inventory:update', userId

  setBusyness: (id, busy)->
    assert_.types [ 'string', 'boolean' ], arguments
    db.update id, BasicUpdater('busy', busy)

  changeOwner: (transacDoc)->
    { item } = transacDoc
    db.get item
    .then Item.changeOwner.bind(null, transacDoc)
    .then db.postAndReturn

  bulkDelete: db.bulkDelete

  nearby: (reqUserId, range = 50, strict = false)->
    user_.nearby reqUserId, range, strict
    .then items_.getUsersAndItemsPublicData(reqUserId)

  getUsersAndItemsPublicData: (reqUserId)-> (usersIds)->
    _.log usersIds, 'usersIds'
    unless usersIds.length > 0 then return [[], []]
    return promises_.all [
      user_.getUsersByIds usersIds, reqUserId
      getByAccessLevel.public usersIds
    ]

  # Data manipulation done on client-side view models (item.serializeData),
  # but useful to have server-side for emails view models
  serializeData: (item)->
    snapshot_.addToItem item
    .then (item)->
      { 'entity:title':title, 'entity:authors':authors, 'entity:image':image } = item.snapshot
      item.title = title
      item.authors = authors
      if image? then item.pictures = [ image ]
      return item

listingByEntities = (listing, uris, reqUserId)->
  keys = uris.map (uri)-> [ uri, listing ]
  db.viewByKeys 'byEntity', keys
  .map filterPrivateAttributes(reqUserId)

bundleListings = (listingsTypes, usersIds, reqUserId)->
  listings = _.combinations usersIds, listingsTypes
  db.viewByKeys 'byListing', listings
  .map filterPrivateAttributes(reqUserId)

entityUriKeys = (entityUri)->
  return listingsPossibilities.map (listing)-> [ entityUri, listing ]

safeItem = (item)-> _.omit item, privateAttrs

FilterWithImage = (assertImage)-> (items)->
  Promise.all items.map(snapshot_.addToItem)
  .then (items)->
    if assertImage then items.filter itemWithImage
    else items

itemWithImage = (item)-> item.snapshot['entity:image']

validateEntityType = (item)->
  getEntityByUri { uri: item.entity }
  .then (entity)->
    { type } = entity

    unless type in whitelistedEntityTypes
      throw error_.new 'invalid entity type', 400, { item, type }

    return item

whitelistedEntityTypes = [ 'edition', 'work' ]
