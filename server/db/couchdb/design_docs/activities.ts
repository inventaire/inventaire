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
      if (doc.type === 'Follow') emit(doc.object.name, null)
    },
  },
  byExternalId: {
    map: doc => {
      if (doc.externalId) emit(doc.externalId, null)
    },
  },
}
