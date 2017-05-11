# Use production databases

## HOW TO:

## SERVER
# - Update databases: ./scripts/start_couch_replication.coffee
# - To use this config file: export NODE_ENV=prod-dbs ; npm run watch
# - before committing, comment-out test/000-env.coffee

## CLIENT
# - in client/app/api/api.coffee set img host to 'https://inventaire.io':
#                => img: sharedLib('api/img')(_, 'https://inventaire.io')

module.exports =
  db:
    suffix: 'prod'
    follow:
      reset: true
  swift:
    container: 'img'
