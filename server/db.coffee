CONFIG = require('config')
nano = require('nano')(CONFIG.dbFullHost)

checkDbExistance = (DBsArray)->
  DBsArray.forEach (dbName)->
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

checkDbExistance ['inventory', 'users']

module.exports = nano.db