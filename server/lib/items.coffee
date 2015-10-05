CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')
Item = __.require 'models', 'item'
error_ = __.require 'lib', 'error/error'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

db = __.require('couch', 'base')('items')

module.exports = items_ =
  db: db
  byId: db.get.bind(db)
  byOwner: (owner)->
    # only used by items.fetch with req.session.email owner
    # => shouldn't be safeItems'ized
    db.viewByKey 'byOwner', owner

  byListing: (owner, listing)->
    _.types arguments, 'strings...'
    db.viewByKey 'byListing', [owner, listing]
    .then safeItems

  batchByListings: (listings)->
    _.types arguments, ['array']
    db.viewByKeys 'byListing', listings
    .then safeItems

  bundleListings: (listingsTypes, usersIds)->
    listings = _.combinations usersIds, listingsTypes
    items_.batchByListings listings

  publicById: (itemId)->
    db.get(itemId)
    .then (item)->
      if item.listing is 'public' then return item
      else throw error_.new 'item isnt a public item', 403, itemId
    .catch (err)->
      # cant filter operational error from the error status code
      # as cot returns a poor error object with just a message
      throw error_.new 'item not found', 404, itemId

  publicByEntity: (entityUri)->
    db.viewByKey 'publicByEntity', entityUri
    .then safeItems

  publicByDate: (limit)->
    params =
      limit: limit
      descending: true
      include_docs: true
    db.viewCustom 'publicByDate', params
    .then safeItems

  publicByOwnerAndEntity: (owner, entityUri)->
    db.viewByKey 'publicByOwnerAndEntity', [owner, entityUri]
    .then safeItems

  create: (userId, item)->
    db.post Item.create(userId, item)

  update: (userId, item)->
    item = Item.update(userId, item)
    db.update item._id, Item.updater.bind(null, userId, item)

  verifyOwnership: (itemId, userId)->
    db.get(itemId)
    .then (item)->
      unless userId is item?.owner
        throw error_.new 'user isnt item.owner', 403, userId, item.owner

      return item

  delete: (id, rev)->
    db.delete(id, rev)

  setBusyness: (id, busy)->
    _.types arguments, ['string', 'boolean']
    db.update id, BasicUpdater('busy', busy)

  fork: (id, options)->
    db.get id
    .then Item.fork.bind(null, options)
    .then db.postAndReturn

  archive: (id)->
    _.type id, 'string'
    db.update id, BasicUpdater('archived', true)

safeItems = (items)->
  items.map (item)->
    item.notes = null
    item.listing = null
    return item
