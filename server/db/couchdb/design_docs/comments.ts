import { emit } from '#db/couchdb/couchdb_views_context'
import type { Comment } from '#types/comment'
import type { Views } from '#types/couchdb'

export const views: Views<Comment> = {
  byTransactionId: {
    map: doc => {
      if (doc.transaction != null) emit(doc.transaction, null)
    },
  },
}
