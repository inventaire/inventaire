db = require '../db'
inv = db.use 'inventory'
Q = require 'q'

# inv.Qlist = Q.denodeify inv.list

inv.isValidItem = (item)->
  requiredKeys = ['title', '_id', 'owner']
  valid = true

  requiredKeys.forEach (key)->
    if not item[key]
      console.log "missing key: #{key}"
      valid = false

  return valid


inv.fetchOwnerItems = ->
  deferred = Q.defer()

  inv.list {include_docs: true}, (err,body)->
    if err
      deferred.reject new Error(err)
    else
      deferred.resolve body

  return deferred.promise


inv.putDocumentToInventoryDB = (doc)->
  deferred = Q.defer()
  inv.insert doc, {name: doc._id}, (err, body)->
    if err
      deferred.reject new Error('CouchDB: ' + err)
    else
      deferred.resolve body
  return deferred.promise


inv.getUniqueItem = (id)->
  deferred = Q.defer()
  inv.get id, (err,body)->
    if err
      deferred.reject new Error(err)
    else
      deferred.resolve body
  return deferred.promise


inv.deleteUniqueItem = (id, rev)->
  deferred = Q.defer()
  inv.destroy id, rev, (err,body)->
    if err
      deferred.reject new Error(err)
    else
      deferred.resolve body
  return deferred.promise


inv.getItemRev = (id)->
  deferred = Q.defer()
  @getUniqueItem id
  .then (item)->
    deferred.resolve item._rev
  .fail (err)->
    deferred.reject new Error(err)
  return deferred.promise

module.exports = inv

  # getOwnerItemsIds: (owner)->
  #   deferred = Q.defer()

  #   inv.whatever


  # getItemsFromIds: (IdsArray)->
  #   deferred = Q.defer()

  # listItems: ->
  #   deferred = Q.defer()
  #   inv.list (err,body)->



