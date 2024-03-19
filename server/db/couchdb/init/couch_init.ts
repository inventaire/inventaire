import type { DatabaseConfig } from '#types/couchdb_init'
import { initDbs } from './init_dbs.js'
import { waitForCouchdb } from './wait_for_couchdb.js'

export async function couchInit (dbsList: DatabaseConfig[]) {
  await waitForCouchdb()
  return initDbs(dbsList)
}
