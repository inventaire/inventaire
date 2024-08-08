import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { InvEntityDoc } from '#types/entity'

export const views: Views<InvEntityDoc> = {
  byClaim: {
    map: doc => {
      if (doc.type === 'entity' && !('redirect' in doc)) {
        // Local entity layers do not have wdt:P31 claims
        const P31Claim = doc.claims['wdt:P31'] && doc.claims['wdt:P31'][0]
        const P31Value = typeof P31Claim === 'object' ? P31Claim.value : P31Claim
        for (const property in doc.claims) {
          for (const claim of doc.claims[property]) {
            const value = typeof claim === 'object' ? claim.value : claim
            emit([ property, value ], P31Value)
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
