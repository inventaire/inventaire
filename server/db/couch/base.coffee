CONFIG = require('config')
__ = CONFIG.root
_ = __.require 'builders', 'utils'
cot = require './cot_base'

# if no designDocName is provided,
# assumes it is the same as the dbBaseName
module.exports = (dbBaseName, designDocName)->
  dbName = CONFIG.db.name dbBaseName
  designDocName or= dbBaseName

  db = cot dbName, designDocName
  nanoMethods = require('./nano_base')(dbName)
  bundles = require('./bundles')(db, _)

  return _.extend db, nanoMethods, bundles
