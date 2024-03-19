import { emit } from '#db/couchdb/couchdb_views_context'
import type { Views } from '#types/couchdb'
import type { Notification } from '#types/notification'

export const views: Views<Notification> = {
  byUserAndTime: {
    map: doc => {
      emit([ doc.user, doc.time ], null)
    },
  },
  bySubject: {
    map: doc => {
      const { data } = doc
      emit(doc.user, 'user')
      if (data.user !== doc.user) emit(data.user, 'data:user')
      if ('group' in data) {
        emit(data.group, 'data:group')
      }
    },
  },
  unreadNotificationsByGroupAndAttribute: {
    map: doc => {
      if (doc.type === 'groupUpdate' && doc.status === 'unread') {
        emit([ doc.data.group, doc.data.attribute ], null)
      }
    },
  },
}
