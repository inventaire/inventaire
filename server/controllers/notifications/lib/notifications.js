import dbFactory from '#db/couchdb/base'
import { minKey, maxKey } from '#lib/couch'
import { assert_ } from '#lib/utils/assert_types'
import { LogErrorAndRethrow } from '#lib/utils/logs'
import Notification from '#models/notification'

const db = dbFactory('notifications')

const notifications_ = {
  byUserId: userId => {
    assert_.string(userId)
    return db.viewCustom('byUserAndTime', {
      startkey: [ userId, maxKey ],
      endkey: [ userId, minKey ],
      include_docs: true,
      descending: true,
    })
    .catch(LogErrorAndRethrow('byUserId'))
  },

  // Make notifications accessible by the subjects they involve:
  // user, group, item etc
  bySubject: subjectId => {
    return db.viewByKey('bySubject', subjectId)
    .catch(LogErrorAndRethrow('bySubject'))
  },

  add: (user, type, data) => {
    const doc = Notification.create({ user, type, data })
    return db.post(doc)
  },

  updateReadStatus: async (userId, times) => {
    assert_.string(userId)
    assert_.numbers(times)
    const keys = times.map(time => [ userId, time ])
    const docs = await db.viewByKeys('byUserAndTime', keys)
    docs.forEach(Notification.markAsRead)
    return db.bulk(docs)
  },

  deleteAllBySubjectId: subjectId => {
    // You absolutly don't want this id to be undefined
    // as this would end up deleting the whole database
    assert_.string(subjectId)
    return notifications_.bySubject(subjectId)
    .then(db.bulkDelete)
  },

  unreadCount: userId => {
    return notifications_.byUserId(userId)
    .then(getUnreadCount)
  },
}

export default notifications_

// Alias
notifications_.deleteAllByUserId = notifications_.deleteAllBySubjectId

const getUnreadCount = notifs => notifs.filter(isUnread).length
const isUnread = notif => notif.status === 'unread'
