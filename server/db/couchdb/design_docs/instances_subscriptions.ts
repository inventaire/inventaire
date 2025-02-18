import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { InstanceSubscription } from '#types/instances'

export const views: Views<InstanceSubscription> = {
  byEventAndEntityAndOrigin: {
    map: doc => {
      emit([ doc.event, doc.uri, doc.instance ], null)
    },
  },
}
