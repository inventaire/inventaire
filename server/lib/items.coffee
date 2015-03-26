CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')


module.exports =
  db: __.require('couch', 'base')('items')
  byOwner: (owner)->
    # only used by items.fetch with req.session.email owner
    # => shouldn't be safeItems'ized
    @db.viewByKey 'byOwner', owner

  byListing: (owner, listing)->
    _.types arguments, 'strings...'
    @db.viewByKey 'byListing', [owner, listing]
    .then safeItems

  batchByListings: (listings)->
    _.types arguments, ['array']
    @db.viewByKeys 'byListing', listings
    .then safeItems

  publicByEntity: (entityUri)->
    @db.viewByKey 'publicByEntity', entityUri
    .then safeItems

  publicByDate: ->
    params =
      limit: 20
      descending: true
      include_docs: true
    @db.viewCustom 'publicByDate', params
    .then safeItems

  publicByOwnerAndEntity: (owner, entityUri)->
    @db.viewByKey 'publicByOwnerAndEntity', [owner, entityUri]
    .then safeItems

safeItems = (items)->
  items.map (item)->
    item.notes = null
    item.listing = null
    return item