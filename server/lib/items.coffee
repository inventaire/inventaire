CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')
Item = __.require 'models', 'item'
error_ = __.require 'lib', 'error/error'


db = __.require('couch', 'base')('items')

module.exports =
  db: db
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
    {_id} = item
    item = Item.update(userId, item)
    db.update _id, Item.updater.bind(null, userId, item)

  verifyOwnership: (itemId, userId)->
    db.get(itemId)
    .catch error_.formatCotNotFound
    .then (item)->
      unless userId is item?.owner
        throw error_.new 'user isnt item.owner', 403, userId, item.owner

      return item

  delete: (id, rev)->
    _.log id, 'deleting!'
    db.delete(id, rev)

safeItems = (items)->
  items.map (item)->
    item.notes = null
    item.listing = null
    return item