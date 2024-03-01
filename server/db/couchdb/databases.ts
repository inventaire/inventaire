// keys: CouchDB databases names
// values: design docs names, corresponding to files in server/db/couchdb/design_docs,
//         which will be converted to JSON design doc documents by couch-init2

export const databases = {
  activities: [ 'activities' ],
  comments: [ 'comments' ],
  entities: [ 'entities', 'entities_deduplicate' ],
  groups: [ 'groups' ],
  images: [ 'images' ],
  items: [ 'items' ],
  lists: [ 'lists' ],
  notifications: [ 'notifications' ],
  patches: [ 'patches' ],
  elements: [ 'elements' ],
  shelves: [ 'shelves' ],
  tasks: [ 'tasks' ],
  oauth_authorizations: [],
  oauth_clients: [],
  oauth_tokens: [],
  transactions: [ 'transactions' ],
  users: [ 'users', 'relations', 'invited' ],
} as const

export type DbName = keyof typeof databases
