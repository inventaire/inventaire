#!/usr/bin/env coffee

# HOW TO:
# -----------------
# customize this files parameters to your current needs
# then run `npm run migrator` to start the migration

dbName = 'users'
designDocName = 'groups'
viewName = 'byName'
# set to false to apply the migration
preview = true

# the database port will be taken from the local config
migration = require('./migration')(dbName, designDocName, preview)

# example of an update function:
# sets searchable to true on all the docs passed to it
updateFunction = (doc)->
  doc.searchable = true
  return doc

# will run the updateFunction on all documents emitted by the view
migration.updateByView viewName, updateFunction
