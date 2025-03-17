import fetch from 'node-fetch'
import { authorizedCouchdbHeaders as headers } from '#db/couchdb/init/credentials'
import config from '#server/config'
import type { AbsoluteUrl } from '#types/common'
import type { DatabaseOperationsSummary } from '#types/couchdb_init'
import { putSecurityDoc } from './put_security_doc.js'
import { syncDesignDocs } from './sync_design_docs.js'

const couchdbOrigin = config.db.getOrigin()

export async function initDb (dbData) {
  const { name: dbName, designDocs } = dbData
  const dbUrl = `${couchdbOrigin}/${dbName}` as AbsoluteUrl
  const operation: DatabaseOperationsSummary = await ensureDbExistance(dbUrl)

  const [ designDocsOps, securityDocOp ] = await Promise.all([
    syncDesignDocs(dbUrl, designDocs),
    putSecurityDoc(dbUrl, dbName),
  ])

  operation.designDocs = designDocsOps
  operation.securityDoc = securityDocOp

  return operation
}

async function ensureDbExistance (dbUrl: AbsoluteUrl) {
  const res = await fetch(dbUrl, { headers })
  if (res.status === 200) {
    return { created: false }
  } else if (res.status === 404) {
    await create(dbUrl)
    return { created: true }
  } else {
    throw new Error(`${res.status}: ${res.statusText}`)
  }
}

async function create (dbUrl: AbsoluteUrl) {
  const res = await fetch(dbUrl, { method: 'PUT', headers })
  if (res.status !== 201) throw new Error(`${res.status}: ${res.statusText}`)
}
