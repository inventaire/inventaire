import CONFIG from 'config'
import { couchdbBundlesFactory } from '#db/couchdb/bundles'
import { databases } from '#db/couchdb/databases'
import { waitForCouchInit } from '#db/couchdb/init'
import type { DatabaseBaseName, DatabaseName, DesignDocName } from '#types/couchdb'
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

export interface DbInfo {
  dbBaseName: DatabaseBaseName
  dbName: DatabaseName
  designDocName: DesignDocName
}

function getHandler (dbBaseName: string, dbName: string, designDocName: string) {
  validate(dbBaseName, designDocName)
  const dbInfo = { dbBaseName, dbName, designDocName }
  const db = { ...dbInfo, ...getDbApi(dbName, designDocName) }
  const bundles = couchdbBundlesFactory(db)
  return {
    ...db,
    ...bundles,
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
