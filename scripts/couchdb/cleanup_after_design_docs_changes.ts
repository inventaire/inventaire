#!/usr/bin/env tsx

// This cleanup script does several things:
// - Delete the design docs created in CouchDB by ./preload_design_docs_changes
// - Remove the symbolic links created in designDocDirectory by ./preload_design_docs_changes
// - Trigger view cleanups to recover the disk space used by now outdated view indexes
//   See https://docs.couchdb.org/en/3.1.2/maintenance/compaction.html#compact-views-cleanup

// Should typically be run as follow, after having restarted the server and made sure that
// everything runs fine and that they will be no need to rollback those changes:
//
//    export NODE_ENV=production; npm run couchdb:cleanup-after-design-docs-changes

import { databases } from '#db/couchdb/databases'
import { authorizedCouchdbHeaders as headers } from '#db/couchdb/init/credentials'
import { requests_ } from '#lib/requests'
import { success } from '#lib/utils/logs'
import config from '#server/config'
import type { AbsoluteUrl } from '#types/common'
import { waitForActiveTasksToBeDone } from './lib/active_tasks.js'
import getDatabasesNames from './lib/get_databases_names.js'

const { suffix } = config.db
const dbsNames = getDatabasesNames(suffix)
const dbBaseUrl = config.db.getOrigin()

async function deleteDesignDocs () {
  const entries = Object.keys(databases)
    .map(dbBaseName => {
      return Object.keys(databases[dbBaseName])
      .map(designDocBaseName => [ dbBaseName, designDocBaseName ])
    })
    .flat()
  return Promise.all(entries.map(deleteDesignDoc))
}

async function deleteDesignDoc ([ dbBaseName, designDocBaseName ]) {
  const dbName = config.db.name(dbBaseName)
  const docUrl = `${dbBaseUrl}/${dbName}/_design/${designDocBaseName}_preload` as AbsoluteUrl
  try {
    const { _rev } = await requests_.get(docUrl, { headers })
    await requests_.delete(`${docUrl}?rev=${_rev}`, { headers })
  } catch (err) {
    if (err.statusCode !== 404) throw err
  }
}

async function removeDatabaseOutdatedViewIndexes (dbName) {
  return requests_.post(`${dbBaseUrl}/${dbName}/_view_cleanup` as AbsoluteUrl, { headers })
}

await deleteDesignDocs()
await Promise.all(dbsNames.map(removeDatabaseOutdatedViewIndexes))
await waitForActiveTasksToBeDone()
success('done')
