import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Shelf } from '#types/shelf'

export const views: Views<Shelf> = {
  byOwner: {
    map: doc => emit(doc.owner, null),
  },
}
