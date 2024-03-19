import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { DocInUserDb } from '#types/user'

export const views: Views<DocInUserDb> = {
  byId: {
    map: doc => {
      if (doc.type === 'invited') {
        emit(doc._id, null)
      }
    },
  },
  byEmail: {
    map: doc => {
      if (doc.type === 'invited') {
        emit(doc.email.toLowerCase(), null)
      }
    },
  },
}
