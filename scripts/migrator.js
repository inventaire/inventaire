#!/usr/bin/env node

/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// HOW TO:
// -----------------
// - create a new migration doc based on db/couchdb/migration_docs
// - eventually, export NODE_ENV=prod-migration to use config/prod-migration
// - run `npm run migrator migration_doc_filename`

let migrationParams
const [ fileName ] = Array.from(process.argv.slice(2))

const __ = require('config').universalPath

// Accept full file path
if (fileName[0] === '/') {
  migrationParams = require(fileName)
} else {
  migrationParams = __.require('couchdb', `migration_docs/${fileName}`)
}

const { viewName, updateFunction } = migrationParams

// the database port will be taken from the local config
const migration = __.require('couchdb', './migration')(migrationParams)

if (viewName) {
  // will run the updateFunction on all documents emitted by the view
  migration.updateByView(viewName, updateFunction)
} else {
  migration.updateAll(updateFunction)
}
