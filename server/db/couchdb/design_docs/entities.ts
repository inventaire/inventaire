import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { InvEntityDoc } from '#types/entity'

export const views: Views<InvEntityDoc> = {
  byClaim: {
    map: doc => {
      if (doc.type === 'entity' && !('redirect' in doc)) {
        for (const property in doc.claims) {
          for (const value of doc.claims[property]) {
            emit([ property, value ], doc.claims['wdt:P31'][0])
          }
        }
      }
    },
  },
  byClaimValue: {
    map: doc => {
      if (doc.type === 'entity' && !('redirect' in doc)) {
        for (const property in doc.claims) {
          for (const value of doc.claims[property]) {
            emit(value, property)
          }
        }
      }
    },
  },
}
