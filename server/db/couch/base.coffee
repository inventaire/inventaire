CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getDbApi = require './cot_base'

# if no designDocName is provided,
# assumes it is the same as the dbBaseName
module.exports = (dbBaseName, designDocName)->
  dbName = CONFIG.db.name dbBaseName
  designDocName or= dbBaseName

  db = getDbApi dbName, designDocName
  bundles = require('./bundles')(db, _)

  return _.extend db, bundles
