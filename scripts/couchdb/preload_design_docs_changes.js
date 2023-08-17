#!/usr/bin/env node

// Preloading design docs so that when design docs are
// effectively updated on server reboot the views are already indexed
// See https://docs.couchdb.org/en/3.2.0/best-practices/views.html#deploying-a-view-change-in-a-live-environment

// Should typically be run as follow, before restarting the server:
//
//   export NODE_ENV=production; npm run couchdb:preload-design-docs-changes

import { symlink } from 'node:fs/promises'
import { databases } from '#db/couchdb/databases'
import { waitForCouchInit } from '#db/couchdb/init'
import { absolutePath } from '#lib/absolute_path'
import { success } from '#lib/utils/logs'
import { waitForActiveTasksToBeDone } from './lib/active_tasks.js'

const designDocFolder = absolutePath('db', 'couchdb/design_docs')

const designDocsNames = Object.values(databases).flat()

const createDesignDocSymbolicLink = async designDocName => {
  try {
    await symlink(`${designDocFolder}/${designDocName}.js`, `${designDocFolder}/${designDocName}_preload.js`)
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}

const createDesignDocsSymbolicLinks = async () => {
  await Promise.all(designDocsNames.map(createDesignDocSymbolicLink))
}

await createDesignDocsSymbolicLinks()
await waitForCouchInit({ preload: true })
// Once here, CouchDB indexer started, this script could be terminated without stopping it
await waitForActiveTasksToBeDone()
success('done')
