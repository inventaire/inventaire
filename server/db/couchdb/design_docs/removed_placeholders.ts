import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { InvEntityDoc } from '#types/entity'

export const views: Views<InvEntityDoc> = {
  byIsbn13: {
    map: doc => {
      if (doc.type === 'removed:placeholder' && 'wdt:P212' in doc.claims) {
        const isbn13 = doc.claims['wdt:P212'][0]
        emit(isbn13, null)
      }
    },
  },
}
