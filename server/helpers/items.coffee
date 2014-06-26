db = require '../db'
db.inventory = db.use 'inventory'
Q = require 'q'

module.exports =
  isValidItem: (item)->
    requiredKeys = ['title', '_id']
    valid = true

    requiredKeys.forEach (key)->
      if not item[key]
        console.log "missing key: #{key}"
        valid = false

    return valid

  postDocumentWithIdToInventoryDB: (doc)->
    deferred = Q.defer()

    db.inventory.insert doc, {name: doc._id}, (err, body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body

    return deferred.promise