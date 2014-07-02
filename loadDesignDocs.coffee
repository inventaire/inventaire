CONFIG = require 'config'
qreq = require 'qreq'
fs = require 'fs'
_ = require './server/helpers/utils'

usersDesignDoc =
  name: 'users'
  id: '_design/users'
  path: './couchdb/users.json'
  body: ()->
    JSON.parse fs.readFileSync(@path).toString()

baseDbUrl = CONFIG.db.fullHost()
usersDbUrl= baseDbUrl + '/' + CONFIG.db.users
# invDbUrl= baseDbUrl + CONFIG.db.inv

qreq.post usersDbUrl, usersDesignDoc.body()
.then (res)-> _.logGreen res, usersDesignDoc.id
.fail (err)-> _.logRed err, usersDesignDoc.id