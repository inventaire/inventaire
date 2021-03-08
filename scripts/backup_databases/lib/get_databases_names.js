const CONFIG = require('config')
const __ = CONFIG.universalPath
const dbsBaseNames = Object.keys(require('db/couchdb/list'))

module.exports = async suffix => {
  if (suffix) return dbsBaseNames.map(dbBaseName => `${dbBaseName}-${suffix}`)
  else return dbsBaseNames
}
