import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Listing } from '#types/listing'

export const views: Views<Listing> = {
  byCreator: {
    map: doc => emit(doc.creator, null),
  },
}
