#!/usr/bin/env -S node --loader ts-node/esm --no-warnings
// A script that just outputs databases names, for the needs of other repositories
import getDatabasesNames from '#scripts/couchdb/lib/get_databases_names'

const [ suffix ] = process.argv.slice(2)
const dbsNames = getDatabasesNames(suffix)
process.stdout.write(dbsNames.join('\n'))
