const dbsBaseNames = Object.keys(require('db/couchdb/databases'))

export default suffix => {
  if (suffix) return dbsBaseNames.map(dbBaseName => `${dbBaseName}-${suffix}`)
  else return dbsBaseNames
}
