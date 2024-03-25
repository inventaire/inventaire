import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { ListingElement } from '#types/element'

export const views: Views<ListingElement> = {
  byEntities: {
    map: doc => {
      if (doc.uri != null) emit(doc.uri, null)
    },
  },
  byListAndEntity: {
    map: doc => {
      emit([ doc.list, doc.uri ], null)
    },
  },
  byListings: {
    map: doc => {
      if (doc.uri != null) emit(doc.list, null)
    },
  },
  byOrdinalAndListing: {
    map: doc => {
      if (doc.uri != null) emit([ doc.list, doc.ordinal ], null)
    },
  },
}
