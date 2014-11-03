CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')

module.exports =
  db: __.require 'db', 'inventory'
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
    @db.view 'items', 'byOwner', {key: owner}
    .then parseValue

  byListing: (owner, listing)->
    @db.view 'items', 'byListing', {key: [owner, listing]}
    .then parseValue
    .then safeItems

  byEntity: (uri)->
    @db.view 'items', 'byEntity', {key: uri}
    .then parseValue
    .then safeItems

  publicByDate: ->
    @db.view 'items', 'publicByDate', {
      limit: 20
      descending: true
    }
    .then parseValue
    .then safeItems

  publicByOwnerAndSuffix: (owner, suffix)->
    @db.view 'items', 'publicByOwnerAndSuffix', {key: [owner, suffix]}
    .then parseValue
    .then safeItems

parseValue = (body)-> body.rows.map (el)-> el.value
safeItems = (items)-> items.map(safeItemData)
safeItemData = (item)->
  item.notes = null
  return item