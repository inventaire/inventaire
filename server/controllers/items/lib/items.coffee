CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
Item = __.require 'models', 'item'
privateAttrs = Item.attributes.private
listingsPossibilities = Item.attributes.constrained.listing.possibilities
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
couch_ = __.require 'lib', 'couch'
promises_ = __.require 'lib', 'promises'
radio = __.require 'lib', 'radio'
{ filterPrivateAttributes } = require './filter_private_attributes'
{ minKey, maxKey } = __.require 'lib', 'couch'
listingsLists = require './listings_lists'
snapshot_ = require './snapshot/snapshot'

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

  networkListings: (usersIds, reqUserId)->
    bundleListings ['network', 'public'], usersIds, reqUserId

  publicListings: (usersIds, reqUserId)->
    usersIds = _.forceArray usersIds
    bundleListings ['public'], usersIds, reqUserId

  byEntity: (entityUri)->
    _.type entityUri, 'string'
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
    .map filterPrivateAttributes(reqUserId)

  publicByLangAndDate: (limit, offset, lang, assertImage, reqUserId)->
    db.viewCustom 'publicByLangAndDate',
      startkey: [ lang, maxKey ]
      endkey: [ lang, minKey ]
      descending: true
      limit: limit or 15
      skip: offset or 0
      include_docs: true
    .then FilterWithImage(assertImage)
    .map filterPrivateAttributes(reqUserId)

  byOwnersAndEntitiesAndListings: (ownersIds, uris, listingsKey, reqUserId)->
    keys = []
    for ownerId in ownersIds
      for uri in uris
        for listing in listingsLists[listingsKey]
          keys.push [ ownerId, uri, listing ]

    db.viewByKeys 'byOwnerAndEntityAndListing', keys
    .map filterPrivateAttributes(reqUserId)

  create: (userId, items)->
    _.type items, 'array'
    itemsDocs = items.map (item)-> Item.create userId, item
    db.bulk itemsDocs
    .then (res)->
      itemsIds = _.pluck res, 'id'
      db.fetch itemsIds
      .tap -> radio.emit 'user:inventory:update', userId

  update: (userId, itemUpdateData)->
    db.get itemUpdateData._id
    .then (currentItem)->
      updatedItem = Item.update userId, itemUpdateData, currentItem
      return updatedItem
    .then db.putAndReturn
    .tap -> radio.emit 'user:inventory:update', userId

  verifyOwnership: (itemId, userId)->
    db.get itemId
    .then (item)->
      unless userId is item?.owner
        throw error_.new 'user isnt item.owner', 403, userId, item.owner

      return item

  delete: (id, rev)->
    db.get id
    .then (currentItem)->
      db.update id, couch_.setDeletedTrue
      .tap ->
        radio.emit 'resource:destroyed', 'item', id
        radio.emit 'user:inventory:update', currentItem.owner

  setBusyness: (id, busy)->
    _.types arguments, ['string', 'boolean']
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
      items_.publicListings usersIds
    ]

  # Data manipulation done on client-side view models (item.serializeData),
  # but useful to have server-side for emails view models
  serializeData: (item)->
    snapshot_.addToItem item
    .then (item)->
      { 'entity:title':title, 'entity:authors':authors, 'entity:image':image } = item.snapshot
      item.title = title
      item.authors = authors
      if image? and item.pictures.length is 0 then item.pictures = [ image ]
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

itemWithImage = (item)-> item.snapshot['entity:image'] or item.pictures.length > 0
