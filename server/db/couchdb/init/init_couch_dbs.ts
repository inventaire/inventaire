import { objectPromise } from '#lib/promises'
import { objectEntries } from '#lib/utils/base'
import type { DatabaseConfig, OperationsSummary } from '#types/couchdb_init'
import { initDb } from './init_db.js'

export async function initCouchDbs (dbsList: DatabaseConfig[]) {
  try {
    const operations = await objectPromise(dbsList.reduce(aggregateInitDb(initDb), {}))
    return { ok: true, operations: minimzeOperationsReport(operations) }
  } catch (err) {
    if (err.message === 'Name or password is incorrect.') {
      throw new Error('CouchDB name or password is incorrect')
    } else {
      throw err
    }
  }
}

const aggregateInitDb = initDb => (index, dbData) => {
  index[dbData.name] = initDb(dbData)
  return index
}

function minimzeOperationsReport (operations: OperationsSummary) {
  const minimized: OperationsSummary = {}
  for (const [ dbName, { created, designDocs, securityDoc } ] of objectEntries(operations)) {
    let dbHasOp = created
    minimized[dbName] = { created }
    for (const [ designDocName, { created, updated } ] of Object.entries(designDocs)) {
      if (created || updated) {
        dbHasOp = true
        minimized[dbName].designDocs = minimized[dbName].designDocs || {}
        if (created) minimized[dbName].designDocs[designDocName] = { created }
        if (updated) minimized[dbName].designDocs[designDocName] = { updated }
      }
    }
    if (securityDoc.created) {
      dbHasOp = true
      minimized[dbName].securityDoc = securityDoc
    }
    if (!dbHasOp) delete minimized[dbName]
  }
  return minimized
}
