import { views as activitiesViews } from '#db/couchdb/design_docs/activities'
import { views as commentsViews } from '#db/couchdb/design_docs/comments'
import { views as elementsViews } from '#db/couchdb/design_docs/elements'
import { views as entitiesViews } from '#db/couchdb/design_docs/entities'
import { views as entitiesDeduplicateViews } from '#db/couchdb/design_docs/entities_deduplicate'
import { views as groupsViews } from '#db/couchdb/design_docs/groups'
import { views as imagesViews } from '#db/couchdb/design_docs/images'
import { views as invitedViews } from '#db/couchdb/design_docs/invited'
import { views as itemsViews } from '#db/couchdb/design_docs/items'
import { views as listsViews } from '#db/couchdb/design_docs/lists'
import { views as notificationsViews } from '#db/couchdb/design_docs/notifications'
import { views as patchesViews } from '#db/couchdb/design_docs/patches'
import { views as relationsViews } from '#db/couchdb/design_docs/relations'
import { views as shelvesViews } from '#db/couchdb/design_docs/shelves'
import { views as tasksViews } from '#db/couchdb/design_docs/tasks'
import { views as transactionsViews } from '#db/couchdb/design_docs/transactions'
import { views as usersViews } from '#db/couchdb/design_docs/users'
import type { DatabaseName } from '#types/couchdb'
import type { DatabaseConfig } from '#types/couchdb_init'

export type Databases = Record<DatabaseName, DatabaseConfig['designDocs']>

export const databases: Databases = {
  activities: {
    activities: activitiesViews,
  },
  comments: {
    comments: commentsViews,
  },
  entities: {
    entities: entitiesViews,
    entities_deduplicate: entitiesDeduplicateViews,
  },
  groups: {
    groups: groupsViews,
  },
  images: {
    images: imagesViews,
  },
  items: {
    items: itemsViews,
  },
  lists: {
    lists: listsViews,
  },
  notifications: {
    notifications: notificationsViews,
  },
  patches: {
    patches: patchesViews,
  },
  elements: {
    elements: elementsViews,
  },
  shelves: {
    shelves: shelvesViews,
  },
  tasks: {
    tasks: tasksViews,
  },
  oauth_authorizations: {},
  oauth_clients: {},
  oauth_tokens: {},
  transactions: {
    transactions: transactionsViews,
  },
  users: {
    users: usersViews,
    relations: relationsViews,
    invited: invitedViews,
  },
} as const

export type DbName = keyof typeof databases
