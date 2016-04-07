# 'default' keys/values are used by couch handler
# checkDbsExistanceOrCreate and reloadDesignDocs
# keys -> dbs names
# values -> design docs

# 'optional' keys/values are dbs names/design_docs
# that aren't required to run on production

module.exports =
  default:
    users: ['user', 'relations', 'groups', 'invited']
    items: ['items', 'followedEntities']
    transactions: ['transactions']
    comments: ['comments']
    entities: ['entities', 'patches']
    analytics: []
    notifications: ['notifications']
  optional:
    analytics: ['reports']
