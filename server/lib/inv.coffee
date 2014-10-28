CONFIG = require 'config'
_ = CONFIG.root.require('builders', 'utils')
invCot = require('../cotDb').inv

module.exports =
  db: invCot
  isValidItem: (item)->
    requiredKeys = ['title', '_id', 'owner']
    valid = true
    requiredKeys.forEach (key)->
      if not item[key]
        console.log "missing key: #{key}"
        valid = false
    return valid

  # get: (id)->
  #   @db.get(id)
  #   .then safeItemData

  byOwner: (owner)->
    # only used by items.fetch with req.session.email owner
    # => shouldn't be safeItems'ized
    invCot.view 'items', 'byOwner', {key: owner}
    .then parseValue

  byListing: (owner, listing)->
    invCot.view 'items', 'byListing', {key: [owner, listing]}
    .then parseValue
    .then safeItems

  byEntity: (uri)->
    invCot.view 'items', 'byEntity', {key: uri}
    .then parseValue
    .then safeItems

  publicByDate: ->
    invCot.view 'items', 'publicByDate', {
      limit: 20
      descending: true
    }
    .then parseValue
    .then safeItems

  publicByOwnerAndSuffix: (owner, suffix)->
    invCot.view 'items', 'publicByOwnerAndSuffix', {key: [owner, suffix]}
    .then parseValue
    .then safeItems

parseValue = (body)-> body.rows.map (el)-> el.value
safeItems = (items)-> items.map(safeItemData)
safeItemData = (item)->
  item.notes = null
  return item