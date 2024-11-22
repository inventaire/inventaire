import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { InvEntityDoc } from '#types/entity'

export const views: Views<InvEntityDoc> = {
  byClaim: {
    map: doc => {
      if (doc.type === 'entity' && !('redirect' in doc)) {
        for (const property in doc.claims) {
          for (const claim of doc.claims[property]) {
            const value = typeof claim === 'object' ? claim.value : claim
            emit([ property, value ], null)
          }
        }
      }
    },
  },
  byClaimValue: {
    map: doc => {
      if (doc.type === 'entity' && !('redirect' in doc)) {
        for (const property in doc.claims) {
          for (const claim of doc.claims[property]) {
            const value = typeof claim === 'object' ? claim.value : claim
            emit(value, property)
          }
        }
      }
    },
  },
}
