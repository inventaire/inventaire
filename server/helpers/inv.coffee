CONFIG = require 'config'
_ = require './utils'
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

  byOwner: (owner)->
    invCot.view 'items', 'byOwner', {key: owner}

  byListing: (owner, listing)->
    invCot.view 'items', 'byListing', {key: [owner, listing]}

  byEntity: (uri)->
    invCot.view 'items', 'byEntity', {key: uri}

  publicByDate: ->
    invCot.view 'items', 'publicByDate', {
      limit: 20
      descending: true
    }

  publicByOwnerAndSuffix: (owner, suffix)->
    invCot.view 'items', 'publicByOwnerAndSuffix', {key: [owner, suffix]}
    .then (body)-> body.rows.map (el)-> el.value