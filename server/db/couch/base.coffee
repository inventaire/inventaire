CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'

params =
  hostname: CONFIG.db.host
  port: CONFIG.db.port
  auth: CONFIG.db.auth()

if CONFIG.db.protocol is 'https'
  params.ssl = true

cot = require('inv-cot')(params)

# if no designDocName is provided,
# assumes it is the same as the dbBaseName
module.exports = (dbBaseName, designDocName)->
  dbName = CONFIG.db.name dbBaseName
  designDocName or= dbBaseName

  db = cot dbName, designDocName
  nanoMethods = __.require('couch', 'nano_base')(dbName)

  return _.extend db, nanoMethods,
    postAndReturn: (doc)->
      cot.post(doc)
      .then _.property('id')
      .then cot.get.bind(cot)
