CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

# Using CouchDB database names + environment suffix as indexes names
syncDataList = [
  { dbBaseName: 'users', type: 'user' }
  { dbBaseName: 'groups', type: 'group' }
  # No 'entities' entry as it is fully handled by the entities search engine
  # See server/controllers/entities/lib/update_search_engine.coffee
]
.map (data)->
  data.dbName = CONFIG.db.name data.dbBaseName
  return data

indexesList = syncDataList.map _.property('dbName')

module.exports = { syncDataList, indexesList }
