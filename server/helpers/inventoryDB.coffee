db = require '../db'
inv = db.use 'inventory'
_ = require './utils'
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
  _.log doc, 'putDocumentToInventoryDB doc'
  deferred = Q.defer()
  inv.insert doc, {name: doc._id}, (err, body)->
    if err
      deferred.reject new Error('CouchDB: ' + err)
    else
      deferred.resolve body
  return deferred.promise


inv.getUniqueItem = (id)->
  _.log id, 'getUniqueItem id'
  deferred = Q.defer()
  inv.get id, (err,body)->
    if err
      deferred.reject new Error(err)
    else
      deferred.resolve body
  return deferred.promise


inv.deleteUniqueItem = (item)->
  _.log item, 'deleteUniqueItem item'
  deferred = Q.defer()
  inv.destroy item._id, item._rev, (err,body)->
    if err
      deferred.reject new Error(err)
    else
      deferred.resolve body
  return deferred.promise


inv.getItemRev = (id)->
  _.log id, 'getItemRev id'
  deferred = Q.defer()
  @getUniqueItem id
  .then (item)->
    deferred.resolve item
  .fail (err)->
    deferred.reject new Error(err)
  return deferred.promise

inv.errorHandler = (err)->
  _.logRed err
  res.status '500'
  res.send 'Server got an error. Please report it'

module.exports = inv