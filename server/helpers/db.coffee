CONFIG = require('config')
nano = require('nano')(CONFIG.dbFullHost)

module.exports =
  checkDbsExistanceOrCreate: (db, checker = checkExistanceOrCreate)->
    if isLowercaseString db
      checker db

    else if db instanceof Array
      valid = true
      db.forEach (dbName)->
        if not isLowercaseString dbName
          valid = false
      if valid
        db.forEach checker
      else
        throw new Error 'only lowercase strings are accepted in an array of DBs'

    else
      throw new Error 'only string and array of strings accepted'

checkExistanceOrCreate = (dbName)->
  nano.db.get dbName, (err,body)->
    if err
      console.log "#{dbName} not found: creating"
      nano.db.create dbName, (err, body)->
        if err
          console.log err
          console.log "couldn't create #{dbName}DB"
        else
          console.log body
          console.log "#{dbName}DB created"
    else
      console.log "#{dbName}DB ready!"

isLowercaseString = (str)->
  typeof str is 'string' && /^[a-z]+$/.test str