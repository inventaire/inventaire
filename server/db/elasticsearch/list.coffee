CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

# Using CouchDB database names + environment suffix as indexes names
syncDataList = [
  { dbBaseName: 'entities', type: 'entity' }
  { dbBaseName: 'users', type: 'user' }
  { dbBaseName: 'groups', type: 'group' }
].map (data)->
  data.dbName = CONFIG.db.name data.dbBaseName
  return data

indexesList = syncDataList.map _.property('dbName')

module.exports = { syncDataList, indexesList }
