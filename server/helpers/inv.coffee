CONFIG = require 'config'
_ = require './utils'
db = require '../db'
invDB = db.use CONFIG.db.inv
Q = require 'q'

module.exports =
  isValidItem: (item)->
    requiredKeys = ['title', '_id', 'owner']
    valid = true
    requiredKeys.forEach (key)->
      if not item[key]
        console.log "missing key: #{key}"
        valid = false
    return valid


  # fetchUserItems: (username)->
  #   deferred = Q.defer()
  #   invDB.list {include_docs: true}, (err,body)->
  #     if err
  #       deferred.reject new Error(err)
  #     else
  #       deferred.resolve body
  #   return deferred.promise

  byOwner: (owner)->
    deferred = Q.defer()
    invDB.view "items", "byOwner", {key: owner}, (err, body) ->
      if err
        deferred.reject new Error('CouchDB problem with byOwner method: ' + err)
      else
        deferred.resolve body
    return deferred.promise

  putDocumentToInventoryDB: (doc)->
    _.log doc, 'putDocumentToInventoryDB doc'
    deferred = Q.defer()
    invDB.insert doc, {name: doc._id}, (err, body)->
      if err
        deferred.reject new Error('CouchDB: ' + err)
      else
        deferred.resolve body
    return deferred.promise


  getUniqueItem: (id)->
    _.log id, 'getUniqueItem id'
    deferred = Q.defer()
    invDB.get id, (err,body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body
    return deferred.promise

  headUniqueItem: (id)->
    _.log id, 'headUniqueItem id'
    deferred = Q.defer()
    invDB.head id, (err,body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body
    return deferred.promise


  deleteUniqueItem: (item)->
    _.log item, 'deleteUniqueItem item'
    deferred = Q.defer()
    invDB.destroy item._id, item._rev, (err,body)->
      if err
        deferred.reject new Error(err)
      else
        deferred.resolve body
    return deferred.promise


  getItemRev: (id)->
    _.log id, 'getItemRev id'
    deferred = Q.defer()
    @getUniqueItem id
    .then (item)->
      deferred.resolve item
    .fail (err)->
      deferred.reject new Error(err)
    return deferred.promise