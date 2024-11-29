import { emit } from '#db/couchdb/couchdb_views_context'
import type { ActivityDoc } from '#types/activity'
import type { Views } from '#types/couchdb'

export const views: Views<ActivityDoc> = {
  byActorNameAndDate: {
    map: doc => emit([ doc.actor.name, doc.updated ], null),
    reduce: '_count',
  },
  followActivitiesByObject: {
    map: doc => {
      if (doc.type === 'Follow') emit([ doc.object.name, doc.updated ], null)
    },
    reduce: '_count',
  },
  byExternalId: {
    map: doc => {
      if (doc.externalId) emit(doc.externalId, null)
    },
  },
  isKnownHostname: {
    map: doc => {
      if (doc.actor && doc.actor.uri) {
        const host = doc.actor.uri.split('/')[2]
        emit(host, null)
      }
    },
  },
}
