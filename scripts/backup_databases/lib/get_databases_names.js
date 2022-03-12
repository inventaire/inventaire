const dbsBaseNames = Object.keys(require('db/couchdb/list'))

module.exports = suffix => {
  if (suffix) return dbsBaseNames.map(dbBaseName => `${dbBaseName}-${suffix}`)
  else return dbsBaseNames
}
