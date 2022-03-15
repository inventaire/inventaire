import { databases } from '#db/couchdb/databases'

const dbsBaseNames = Object.keys(databases)

export default suffix => {
  if (suffix) return dbsBaseNames.map(dbBaseName => `${dbBaseName}-${suffix}`)
  else return dbsBaseNames
}
