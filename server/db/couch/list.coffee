# 'default' keys/values are used by couch init
# keys -> dbs names
# values -> design docs

# 'optional' keys/values are dbs names/design_docs
# that aren't required to run on production

module.exports =
  users: [ 'users', 'relations', 'invited' ]
  groups: [ 'groups' ]
  items: [ 'items' ]
  transactions: [ 'transactions' ]
  comments: [ 'comments' ]
  entities: [ 'entities', 'entities_deduplicate', 'entities_tmp' ]
  patches: [ 'patches', 'patches_tmp' ]
  notifications: [ 'notifications' ]
  tasks: [ 'tasks' ]
