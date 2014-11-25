CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')

module.exports =
  db: __.require 'couch', 'inventory'
  isValidItem: (item)->
    requiredKeys = ['title', '_id', 'owner']
    valid = true
    requiredKeys.forEach (key)->
      if not item[key]
        console.log "missing key: #{key}"
        valid = false
    return valid

  byOwner: (owner)->
    # only used by items.fetch with req.session.email owner
    # => shouldn't be safeItems'ized
    @db.viewByKey 'byOwner', owner

  byListing: (owner, listing)->
    @db.viewByKey 'byListing', [owner, listing]
    .then safeItems

  byEntity: (uri)->
    @db.viewByKey 'byEntity', uri
    .then safeItems

  publicByDate: ->
    params =
      limit: 20
      descending: true
    @db.viewCustom 'publicByDate', params
    .then safeItems

  publicByOwnerAndSuffix: (owner, suffix)->
    @db.viewByKey 'publicByOwnerAndSuffix', [owner, suffix]
    .then safeItems

safeItems = (items)-> items.map(safeItemData)
safeItemData = (item)->
  item.notes = null
  return item