CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
hardCodedDocuments = require './hard_coded_documents'

module.exports = ->
  promises = []

  for dbName, docs of hardCodedDocuments
    db = __.require('couch', 'base')(dbName)
    for docName, doc of docs
      promises.push updateDoc(db, doc)

  return promises_.all promises

updateDoc = (db, doc)->
  { _id:id } = doc
  db.get id
  .then (currentDoc)->
    # Copy the _rev so that the doc have a chance to match
    # and, if not, so that we can use db.put
    docPath = "#{db.name}/#{id}"
    doc._rev = currentDoc._rev
    if _.eq currentDoc, doc
      _.info "#{docPath} is up-to-date"
      return
    else
      db.put doc
      .then _.Success("#{docPath} updated")

  .catch (err)->
    # If the doc is missing, create it
    if err.statusCode is 404 then db.put doc
    else throw err
