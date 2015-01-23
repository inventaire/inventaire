CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
host = CONFIG.db.fullHost()
nano = require('nano') host
dbInit = __.require 'couch', 'couch_init'
Radio = __.require 'lib', 'radio'

module.exports =
  checkDbsExistanceOrCreate: (dbsNames)->
    _.types dbsNames, 'strings...'
    dbsNames.forEach (dbName)->
      assertValidDbName(dbName)
      checkExistanceOrCreate(dbName)

  reloadDesignDocs: ->
    CONFIG.db.names.forEach (dbName)->
      dbInit.designDoc.update dbName

checkExistanceOrCreate = (dbName)->
  customDbName = CONFIG.db.name(dbName)
  nano.db.get customDbName, (err, body)->
    unless err?
      _.info "#{dbName}DB ready!"
    else
      _.info "#{customDbName} not found: creating"
      createDb(dbName)
    Radio.emit 'db:ready'

createDb = (dbName)->
  customDbName = CONFIG.db.name(dbName)
  nano.db.create customDbName, (err, body)->
    if err then _.error err, "couldn't create #{customDbName} CouchDB at #{host}"
    else
      _.success body, "#{customDbName} CouchDB created"
      loadConfigurationDocs(dbName)

assertValidDbName = (str)->
  unless _.isString(str) and /^[a-z_$()+-\/]+$/.test str
    throw "invalid db name: #{str}.
    only lowercase strings are accepted in an array of DBs"

loadConfigurationDocs = (dbName)->
  dbInit.designDoc.load dbName

  if CONFIG.db.restricted
    dbInit.putSecurityDoc dbName

  if dbName is 'users' and CONFIG.db.fakeUsers
    dbInit.loadFakeUsers()