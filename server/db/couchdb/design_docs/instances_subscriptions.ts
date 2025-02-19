import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { InstanceSubscription } from '#types/instances'

export const views: Views<InstanceSubscription> = {
  byEventAndEntityAndOrigin: {
    map: doc => {
      emit([ doc.event, doc.uri, doc.instance ], null)
    },
  },

  byNextNotificationAttemptTime: {
    map: doc => {
      if ('notificationFailed' in doc) {
        const { attempts, lastAttempt } = doc.notificationFailed
        const delay = Math.min(5 * 60 * 1000 * 2 ** attempts, 10 * 24 * 3600 * 1000)
        const nextAttempt = lastAttempt + delay
        emit(nextAttempt, null)
      }
    },
  },
}
