const dbsBaseNames = Object.keys(require('db/couchdb/databases'))

module.exports = suffix => {
  if (suffix) return dbsBaseNames.map(dbBaseName => `${dbBaseName}-${suffix}`)
  else return dbsBaseNames
}
