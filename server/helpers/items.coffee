db = require '../db'
inv = db.use 'inventory'
Q = require 'q'

# inv.Qlist = Q.denodeify inv.list

module.exports =
  isValidItem: (item)->
    requiredKeys = ['title', '_id']
    valid = true

    requiredKeys.forEach (key)->
      if not item[key]
        console.log "missing key: #{key}"
        valid = false

    return valid


  fetchOwnerItems: ->
    deferred = Q.defer()

    inv.list {include_docs: true}, (err,body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body

    return deferred.promise


  putDocumentToInventoryDB: (doc)->
    deferred = Q.defer()
    inv.insert doc, {name: doc._id}, (err, body)->
      if err
        deferred.reject new Error('CouchDB: ' + err)
      else
        deferred.resolve body
    return deferred.promise


  getUniqueItem: (id)->
    deferred = Q.defer()
    inv.get id, (err,body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body
    return deferred.promise

  # getOwnerItemsIds: (owner)->
  #   deferred = Q.defer()

  #   inv.whatever


  # getItemsFromIds: (IdsArray)->
  #   deferred = Q.defer()

  # listItems: ->
  #   deferred = Q.defer()
  #   inv.list (err,body)->



