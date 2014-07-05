CONFIG = require 'config'
qreq = require 'qreq'
fs = require 'fs'
_ = require './utils'

usersDesignDoc =
  name: 'users'
  id: '_design/users'
  path: './couchdb/users.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

baseDbUrl = CONFIG.db.fullHost()
usersDbUrl = baseDbUrl + '/' + CONFIG.db.users
# invDbUrl= baseDbUrl + CONFIG.db.inv

usersDesignLoader = ->
  _.logBlue 'usersDesignLoader'
  qreq.post usersDbUrl, usersDesignDoc.body()
  .then (res)-> _.logGreen res.body, "#{usersDesignDoc.id} for #{usersDbUrl}"
  .fail (err)-> _.logRed err.body, "#{usersDesignDoc.id} for #{usersDbUrl}"

module.exports = usersDesignLoader