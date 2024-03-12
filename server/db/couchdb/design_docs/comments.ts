import { emit } from '#db/couchdb/couchdb_views_context'
import type { TransactionComment } from '#types/comment'
import type { Views } from '#types/couchdb'

export const views: Views<TransactionComment> = {
  byTransactionId: {
    map: doc => {
      if (doc.transaction != null) emit(doc.transaction, null)
    },
  },
}
