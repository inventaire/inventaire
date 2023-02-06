#!/usr/bin/env node

// This cleanup script does several things:
// - Delete the design docs created in CouchDB by ./preload_design_docs_changes
// - Remove the symbolic links created in designDocFolder by ./preload_design_docs_changes
// - Trigger view cleanups to recover the disk space used by now outdated view indexes
//   See https://docs.couchdb.org/en/3.1.2/maintenance/compaction.html#compact-views-cleanup

// Should typically be run as follow, after having restarted the server and made sure that
// everything runs fine and that they will be no need to rollback those changes:
//
//    export NODE_ENV=production; npm run couchdb:cleanup-after-design-docs-changes

import CONFIG from 'config'
import { databases } from '#db/couchdb/databases'
import { absolutePath } from '#lib/absolute_path'
import { requests_ } from '#lib/requests'
import { success } from '#lib/utils/logs'
import { shellExec } from '#scripts/scripts_utils'
import { waitForActiveTasksToBeDone } from './lib/active_tasks.js'
import getDatabasesNames from './lib/get_databases_names.js'

const designDocFolder = absolutePath('db', 'couchdb/design_docs')

const { suffix } = CONFIG.db
const dbsNames = getDatabasesNames(suffix)
const dbBaseUrl = CONFIG.db.getOrigin()

const deleteDesignDocsSymbolicLinks = async () => {
  await shellExec(`rm -f ${designDocFolder}/*_preload.js`)
}

const deleteDesignDocs = async () => {
  const entries = Object.keys(databases)
    .map(dbBaseName => databases[dbBaseName].map(designDocBaseName => [ dbBaseName, designDocBaseName ]))
    .flat()
  return Promise.all(entries.map(deleteDesignDoc))
}

const deleteDesignDoc = async ([ dbBaseName, designDocBaseName ]) => {
  const dbName = CONFIG.db.name(dbBaseName)
  const docUrl = `${dbBaseUrl}/${dbName}/_design/${designDocBaseName}_preload`
  try {
    const { _rev } = await requests_.get(docUrl)
    await requests_.delete(`${docUrl}?rev=${_rev}`)
  } catch (err) {
    if (err.statusCode !== 404) throw err
  }
}

const removeDatabaseOutdatedViewIndexes = async dbName => {
  return requests_.post(`${dbBaseUrl}/${dbName}/_view_cleanup`)
}

await Promise.all([
  deleteDesignDocs(),
  deleteDesignDocsSymbolicLinks(),
])
await Promise.all(dbsNames.map(removeDatabaseOutdatedViewIndexes))
await waitForActiveTasksToBeDone()
success('done')
