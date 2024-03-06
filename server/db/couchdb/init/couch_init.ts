import type { Url } from '#types/common'
import type { DatabaseConfig } from '#types/couchdb_init'
import { initDbs } from './init_dbs.js'
import { waitForCouchdb } from './wait_for_couchdb.js'

export async function couchInit (dbHostUrlWithAuth: Url, dbsList: DatabaseConfig[]) {
  if (!/^https?:\/\/[\w-]+:[^@]+@.+/.test(dbHostUrlWithAuth)) {
    throw new Error('expected a db url with username and password')
  }

  if (!(dbsList instanceof Array)) {
    throw new Error('expected dbsList to be an array')
  }

  await waitForCouchdb(dbHostUrlWithAuth)

  return initDbs(dbHostUrlWithAuth, dbsList)
}
