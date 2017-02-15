CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
Item = __.require 'models', 'item'
privateAttrs = Item.attributes.private
listingsPossibilities = Item.attributes.constrained.listing.possibilities
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
couch_ = __.require 'lib', 'couch'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
Radio = __.require 'lib', 'radio'
filterPrivateAttributes = require './filter_private_attributes'
{ maxKey } = __.require 'lib', 'couch'

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

  friendsListings: (usersIds, requesterId)->
    bundleListings ['friends', 'public'], usersIds, requesterId

  publicListings: (usersIds, requesterId)->
    usersIds = _.forceArray usersIds
    bundleListings ['public'], usersIds, requesterId

  byEntity: (entityUri)-> db.viewByKeys 'byEntity', entityUriKeys(entityUri)
  byPreviousEntity: (entityUri)-> db.viewByKey 'byPreviousEntity', entityUri

  # all items from an entity that require a specific authorization
  authorizedByEntities: (uris, requesterId)->
    listingByEntities 'friends', uris, requesterId

  publicByEntities: (uris, requesterId)->
    listingByEntities 'public', uris, requesterId

  publicByDate: (limit=15, offset=0, assertImage=false, requesterId)->
    db.viewCustom 'publicByDate',
      limit: limit
      skip: offset
      descending: true
      include_docs: true
    .then FilterWithImage(assertImage)
    .map filterPrivateAttributes(requesterId)

  byOwnersAndEntitiesAndListings: (ownersIds, uris, listingsKey, requesterId)->
    keys = []
    for ownerId in ownersIds
      for uri in uris
        for listing in listingsLists[listingsKey]
          keys.push [ownerId, uri, listing]

    db.viewByKeys 'byOwnerAndEntityAndListing', keys
    .map filterPrivateAttributes(requesterId)

  create: (userId, item)->
    db.post Item.create userId, item

  update: (userId, item)->
    db.update item._id, Item.update.bind(null, userId, item)

  verifyOwnership: (itemId, userId)->
    db.get itemId
    .then (item)->
      unless userId is item?.owner
        throw error_.new 'user isnt item.owner', 403, userId, item.owner

      return item

  delete: (id, rev)->
    db.update id, couch_.setDeletedTrue
    .then -> Radio.emit 'resource:destroyed', 'item', id

  setBusyness: (id, busy)->
    _.types arguments, ['string', 'boolean']
    db.update id, BasicUpdater('busy', busy)

  changeOwner: (transacDoc)->
    { item } = transacDoc
    db.get item
    .then Item.changeOwner.bind(null, transacDoc)
    .then db.postAndReturn

  bulkDelete: db.bulkDelete

  nearby: (userId, range=50, strict=false)->
    user_.nearby userId, range, strict
    .then items_.getUsersAndItemsPublicData

  getUsersAndItemsPublicData: (usersIds)->
    _.log usersIds, 'usersIds'
    unless usersIds.length > 0 then return [[], []]
    return promises_.all [
      user_.getUsersPublicData(usersIds).then _.Log('users')
      items_.publicListings(usersIds).then _.Log('items')
    ]

  # Data manipulation done on client-side view models (item.serializeData),
  # but useful to have server-side for emails view models
  importSnapshotData: (item)->
    { 'entity:authors':authors, 'entity:image':image } = item.snapshot
    item.authors = authors
    if image? and item.pictures.length is 0 then item.pictures = [ image ]
    return item

listingByEntities = (listing, uris, requesterId)->
  keys = uris.map (uri)-> [uri, listing]
  db.viewByKeys 'byEntity', keys
  .map filterPrivateAttributes(requesterId)

bundleListings = (listingsTypes, usersIds, requesterId)->
  listings = _.combinations usersIds, listingsTypes
  db.viewByKeys 'byListing', listings
  .map filterPrivateAttributes(requesterId)

entityUriKeys = (entityUri)->
  return listingsPossibilities.map (listing)-> [entityUri, listing]

safeItem = (item)-> _.omit item, privateAttrs

FilterWithImage = (assertImage)->
  return fn = (items)->
    if assertImage then items.filter itemWithImage
    else items

itemWithImage = (item)-> item.snapshot['entity:image'] or item.pictures.length > 0

listingsLists =
  user: [ 'private', 'friends', 'public' ]
  network: [ 'friends', 'public' ]
  public: [ 'public' ]
