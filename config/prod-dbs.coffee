# Use production databases

## HOW TO:

## SERVER
# - Update databases: ./scripts/start_couch_replication.coffee
# - To use this config file: export NODE_ENV=prod-dbs ; npm run watch
# - Start a tunnel to the prod elastic search if you need to work with search
#   ssh -L 9201:localhost:9200 $PRODUSERNAME@$PROD -N

module.exports =
  env: 'prod-dbs'
  readOnly: true
  imageRedirection: 'https://inventaire.io'
  db:
    suffix: 'prod'
    follow:
      reset: false
      freeze: true
  swift:
    container: 'img'
  elasticsearch:
    host: 'http://localhost:9201'
