import fetch from 'node-fetch'
import CONFIG from '#server/config'
import type { DatabaseOperationsSummary } from '#types/couchdb_init'
import { putSecurityDoc } from './put_security_doc.js'
import { syncDesignDocs } from './sync_design_docs.js'

const couchdbHost = CONFIG.db.getOrigin()

export async function initDb (dbData) {
  const { name: dbName, designDocs } = dbData
  const dbUrl = `${couchdbHost}/${dbName}`
  const operation: DatabaseOperationsSummary = await ensureDbExistance(dbUrl)

  const [ designDocsOps, securityDocOp ] = await Promise.all([
    syncDesignDocs(dbUrl, designDocs),
    putSecurityDoc(dbUrl, dbName),
  ])

  operation.designDocs = designDocsOps
  operation.securityDoc = securityDocOp

  return operation
}

const ensureDbExistance = async dbUrl => {
  const res = await fetch(dbUrl)
  if (res.status === 200) {
    return { created: false }
  } else if (res.status === 404) {
    await create(dbUrl)
    return { created: true }
  } else {
    throw new Error(`${res.status}: ${res.statusText}`)
  }
}

const create = async dbUrl => {
  const res = await fetch(dbUrl, { method: 'PUT' })
  if (res.status !== 201) throw new Error(`${res.status}: ${res.statusText}`)
}
