# Indexation

Environment:
```sh
# Used to determine
# - CouchDB host, credentials, and databases names
# - Elasticsearch host, and indexes names
# - LevelDB folder (relevant for document formatters relying on cached values)
# Any of those values can be overwritten by setting the corresponding parameter in config/local.js
export NODE_ENV=production
```

## Items
```sh
npm run indexation:load-from-couchdb items
```

## Users
```sh
npm run indexation:load-from-couchdb users
```

## Groups
```sh
npm run indexation:load-from-couchdb groups
```

## Entities
### Inventaire entities
```sh
npm run indexation:load-from-couchdb entities
```
