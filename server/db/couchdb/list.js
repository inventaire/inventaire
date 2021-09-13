const { remoteEntities } = require('config')

// 'default' keys/values are used by couch init
// keys -> dbs names
// values -> design docs

// 'optional' keys/values are dbs names/design_docs
// that aren't required to run on production

const list = {
  activities: [ 'activities' ],
  comments: [ 'comments' ],
  groups: [ 'groups' ],
  images: [ 'images' ],
  items: [ 'items' ],
  notifications: [ 'notifications' ],
  shelves: [ 'shelves' ],
  oauth_authorizations: [],
  oauth_clients: [],
  oauth_tokens: [],
  transactions: [ 'transactions' ],
  users: [ 'users', 'relations', 'invited' ],
}

if (remoteEntities == null) {
  Object.assign(list, {
    entities: [ 'entities', 'entities_deduplicate' ],
    patches: [ 'patches' ],
    tasks: [ 'tasks' ],
  })
}

module.exports = list
