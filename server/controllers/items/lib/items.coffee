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

db = __.require('couch', 'base')('items')

module.exports = items_ =
  db: db
  byId: db.get
  byOwner: (owner)->
    # only used by items.fetch with req.session.email owner
    # => shouldn't be safeItem'ized
    db.viewByKey 'byOwner', owner

  byListing: (owner, listing)->
    _.types arguments, 'strings...'
    db.viewByKey 'byListing', [owner, listing]
    .map safeItem

  batchByListings: (listings)->
    _.types arguments, ['array']
    db.viewByKeys 'byListing', listings
    .map safeItem

  bundleListings: (listingsTypes, usersIds)->
    listings = _.combinations usersIds, listingsTypes
    items_.batchByListings listings

  friendsListings: (usersIds)->
    items_.bundleListings ['friends', 'public'], usersIds

  publicListings: (usersIds)->
    usersIds = _.forceArray usersIds
    items_.bundleListings ['public'], usersIds

  publicById: (itemId)->
    db.get(itemId)
    .then (item)->
      if item.listing is 'public' then return item
      else throw error_.new 'item isnt a public item', 403, itemId
    .catch (err)->
      # cant filter operational error from the error statusCode
      # as cot returns a poor error object with just a message
      throw error_.new 'item not found', 404, itemId

  byEntity: (entityUri)-> db.viewByKeys 'byEntity', entityUriKeys(entityUri)
  byPreviousEntity: (entityUri)-> db.viewByKey 'byPreviousEntity', entityUri

  picturesByEntity: (entityUri)->
    items_.byEntity entityUri
    .map _.property('pictures')

  publicByEntity: (entityUri)->
    db.viewByKey 'byEntity', [entityUri, 'public']
    .map safeItem

  byIsbn: (isbn)->
    db.viewByKeys 'byEntity', entityUriKeys("isbn:#{isbn}")
    .map safeItem

  publicByDate: (limit=15, offset=0, assertImage=false)->
    db.viewCustom 'publicByDate',
      limit: limit
      skip: offset
      descending: true
      include_docs: true
    .then FilterWithImage(assertImage)
    .map safeItem

  publicByOwnerAndEntity: (owner, entityUri)->
    db.viewByKey 'publicByOwnerAndEntity', [owner, entityUri]
    .map safeItem

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

entityUriKeys = (entityUri)->
  return listingsPossibilities.map (listing)-> [entityUri, listing]

safeItem = (item)-> _.omit item, privateAttrs

FilterWithImage = (assertImage)->
  return fn = (items)->
    if assertImage then items.filter itemWithImage
    else items

itemWithImage = (item)-> item.snapshot['entity:image'] or item.pictures.length > 0
