# Use production databases

## HOW TO:

## SERVER
# - Update databases: ./scripts/start_couch_replication.coffee
# - To use this config file: export NODE_ENV=prod-dbs ; npm run watch

module.exports =
  env: 'prod-dbs'
  imageRedirection: 'https://inventaire.io'
  db:
    suffix: 'prod'
    follow:
      reset: false
      freeze: true
  swift:
    container: 'img'
