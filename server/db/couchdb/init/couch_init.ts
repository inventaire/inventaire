import type { DatabaseConfig } from '#types/couchdb_init'
import { initDbs } from './init_dbs.js'

export async function couchInit (dbsList: DatabaseConfig[]) {
  return initDbs(dbsList)
}
