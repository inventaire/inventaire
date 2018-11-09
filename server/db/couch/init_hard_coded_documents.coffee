CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
users = _.values require('./hard_coded_documents').users
usersDb = __.require('couch', 'base')('users')

module.exports = ->
  # Updating sequentially so that blue-cot initialize only a cookie session only once.
  # This seems to be required to avoid getting a 401 from CouchDB,
  # especially when CouchDB just started
  # Known case: when starting CouchDB and the server together with docker-compose
  sequentialUpdate = ->
    nextUser = users.shift()
    unless nextUser? then return

    updateDoc usersDb, nextUser
    .then sequentialUpdate

  return sequentialUpdate()

updateDoc = (db, doc)->
  { _id: id } = doc
  db.get id
  .then (currentDoc)->
    # Copy the _rev so that the doc have a chance to match
    # and, if not, so that we can use db.put
    docPath = "#{db.name}/#{id}"
    doc._rev = currentDoc._rev
    if _.isEqual currentDoc, doc
      _.info "#{docPath} is up-to-date"
      return
    else
      db.put doc
      .then _.Success("#{docPath} updated")

  .catch (err)->
    # If the doc is missing, create it
    if err.statusCode is 404 then db.put doc
    else throw err
