import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { ListingElement } from '#types/element'

export const views: Views<ListingElement> = {
  byEntity: {
    map: doc => {
      if (doc.uri != null) emit(doc.uri, null)
    },
  },
  byPreviousEntity: {
    map: doc => {
      if (doc.previousUris != null) {
        for (const uri of doc.previousUris) {
          emit(uri, null)
        }
      }
    },
  },
  byListAndEntity: {
    map: doc => {
      emit([ doc.list, doc.uri ], null)
    },
  },
  byListing: {
    map: doc => {
      if (doc.uri != null) emit(doc.list, null)
    },
  },
  byListingAndOrdinal: {
    map: doc => {
      if (doc.uri != null) emit([ doc.list, doc.ordinal ], null)
    },
  },
}
