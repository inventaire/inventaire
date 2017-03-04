# Apply migration on production databases

## HOW TO:

# - Open SSH tunnel on production CouchDB on port 3456
# - run migration by passing the appropriate environment name:
#   export NODE_ENV=prod-migration; npm run migrator groups_add_searchable

module.exports =
  db:
    suffix: 'prod'
    freezeFollow: true
    port: 3456
