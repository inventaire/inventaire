CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
host = CONFIG.db.fullHost()
nano = require('nano') host
dbInit = __.require 'couch', 'couch_init'

module.exports =
  checkDbsExistanceOrCreate: (db, checker = @checkExistanceOrCreate)->
    DbRecreated = false
    if @isValidDbName db then checker db
    else if _.isArray(db)
      valid = true
      db.forEach (dbName)=>
        unless dbName? then throw "missing dbName: got #{dbName}"
        if not @isValidDbName dbName then valid = false

      if valid then db.forEach checker
      else
        _.error db, 'bad db names'
        throw new Error 'only lowercase strings are accepted in an array of DBs'

    else
      throw new Error 'only string and array of strings accepted'

  checkExistanceOrCreate: (dbName)->
    nano.db.get dbName, (err,body)->
      if err?
        _.info "#{dbName} not found: creating"
        nano.db.create dbName, (err, body)->
          if err then _.error err, "couldn't create #{dbName} CouchDB at #{host}"
          else
            if /^users/.test dbName
              dbInit.usersDesignLoader()
              dbInit.loadFakeUsers()  if CONFIG.db.fakeUsers
            if /^inventory/.test dbName
              dbInit.invDesignLoader()
            _.success body, "#{dbName} CouchDB created"
      else
        _.info "#{dbName}DB ready!"

  isValidDbName: (str)->
    _.isString(str) and /^[a-z_$()+-\/]+$/.test str

  reloadDesignDocs: ->
    dbInit.usersDesignUpdater()
    dbInit.invDesignUpdater()