import CONFIG from 'config'
import { couchdbBundlesFactory } from '#db/couchdb/bundles'
import { databases } from '#db/couchdb/databases'
import { waitForCouchInit } from '#db/couchdb/init'
import getDbApi from './cot_base.js'

export default async function (dbBaseName: string, designDocName?: string) {
  await waitForCouchInit()
  const dbName = CONFIG.db.name(dbBaseName)
  // If no designDocName is provided while there are defined design docs for this database,
  // assumes that it is the default design doc, which has the same name as the dbBaseName
  if (Object.keys(databases[dbBaseName]).length > 0 && designDocName == null) {
    designDocName = dbBaseName
  }
  return getHandler(dbBaseName, dbName, designDocName)
}

function getHandler (dbBaseName: string, dbName: string, designDocName: string) {
  validate(dbBaseName, designDocName)
  const db = getDbApi(dbName, designDocName)
  const bundles = couchdbBundlesFactory(db)
  const dbInfo = { dbBaseName, dbName, designDocName }
  return {
    ...db,
    ...bundles,
    ...dbInfo,
  }
}

// Not using error_ as that would make hard to solve cirucular dependencies
function validate (dbBaseName: string, designDocName: string) {
  if (!databases[dbBaseName]) {
    throw new Error(`unknown dbBaseName: ${dbBaseName}`)
  }

  if (designDocName && !(designDocName in databases[dbBaseName])) {
    throw new Error(`unknown designDocName: ${designDocName}`)
  }
}
