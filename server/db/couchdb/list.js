// 'default' keys/values are used by couch init
// keys -> dbs names
// values -> design docs

// 'optional' keys/values are dbs names/design_docs
// that aren't required to run on production

module.exports = {
  comments: [ 'comments' ],
  entities: [ 'entities', 'entities_deduplicate' ],
  groups: [ 'groups' ],
  images: [ 'images' ],
  items: [ 'items' ],
  notifications: [ 'notifications' ],
  patches: [ 'patches' ],
  shelves: [ 'shelves' ],
  tasks: [ 'tasks' ],
  transactions: [ 'transactions' ],
  users: [ 'users', 'relations', 'invited' ],
}
