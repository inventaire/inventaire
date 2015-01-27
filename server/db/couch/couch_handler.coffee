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
    dbsNames.forEach (dbBaseName)->
      assertValidDbName(dbBaseName)
      checkExistanceOrCreate(dbBaseName)

  reloadDesignDocs: ->
    CONFIG.db.names.forEach (dbBaseName)->
      dbInit.designDoc.update dbBaseName

checkExistanceOrCreate = (dbBaseName)->
  dbName = CONFIG.db.name(dbBaseName)
  nano.db.get dbName, (err, body)->
    unless err?
      _.info "#{dbBaseName}DB ready!"
    else
      _.info "#{dbName} not found: creating"
      createDb(dbBaseName)
    Radio.emit 'db:ready'

createDb = (dbBaseName)->
  dbName = CONFIG.db.name(dbBaseName)
  nano.db.create dbName, (err, body)->
    if err then _.error err, "couldn't create #{dbName} CouchDB at #{host}"
    else
      _.success body, "#{dbName} CouchDB created"
      loadConfigurationDocs(dbBaseName)

assertValidDbName = (str)->
  unless _.isString(str) and /^[a-z_$()+-\/]+$/.test str
    throw "invalid db name: #{str}.
    only lowercase strings are accepted in an array of DBs"

loadConfigurationDocs = (dbBaseName)->
  dbInit.designDoc.load dbBaseName

  if CONFIG.db.restricted
    dbInit.putSecurityDoc dbBaseName

  if dbBaseName is 'users' and CONFIG.db.fakeUsers
    dbInit.loadFakeUsers()