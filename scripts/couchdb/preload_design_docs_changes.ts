#!/usr/bin/env -S node --loader ts-node/esm --no-warnings

// Preloading design docs so that when design docs are
// effectively updated on server reboot the views are already indexed
// See https://docs.couchdb.org/en/3.2.0/best-practices/views.html#deploying-a-view-change-in-a-live-environment

// Should typically be run as follow, before restarting the server:
//
//   export NODE_ENV=production; npm run couchdb:preload-design-docs-changes

import { waitForCouchInit } from '#db/couchdb/init'
import { success } from '#lib/utils/logs'
import { waitForActiveTasksToBeDone } from './lib/active_tasks.js'

await waitForCouchInit({ preload: true })
// Once here, CouchDB indexer started, this script could be terminated without stopping it
await waitForActiveTasksToBeDone()
success('done')
