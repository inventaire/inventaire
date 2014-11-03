CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
nano = require('nano') CONFIG.db.fullHost()
dbInit = __.require 'db', 'couch_init'

module.exports =
  checkDbsExistanceOrCreate: (db, checker = @checkExistanceOrCreate)->
    DbRecreated = false
    if @isValidDbName db
      checker db

    else if db instanceof Array
      valid = true
      db.forEach (dbName)=>
        unless dbName? then throw "missing dbName: got #{dbName}"
        if not @isValidDbName dbName
          valid = false
      if valid
        db.forEach checker
      else
        _.log db, 'bad db names'
        throw new Error 'only lowercase strings are accepted in an array of DBs'

    else
      throw new Error 'only string and array of strings accepted'

  checkExistanceOrCreate: (dbName)->
    nano.db.get dbName, (err,body)->
      if err
        console.log "#{dbName} not found: creating"
        nano.db.create dbName, (err, body)->
          if err
            console.log err
            console.log "couldn't create #{dbName}DB"
          else
            if dbName == 'users' or dbName == 'users-tests'
              dbInit.usersDesignLoader()
              dbInit.loadFakeUsers()  if CONFIG.fakeUsers
            if dbName == 'inventory' or dbName == 'inventory-tests'
              dbInit.invDesignLoader()
            console.log body
            console.log "#{dbName}DB created"
      else
        console.log "#{dbName}DB ready!"

  isValidDbName: (str)->
    typeof str is 'string' && /^[a-z_$()+-\/]+$/.test str