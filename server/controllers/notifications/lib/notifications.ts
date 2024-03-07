import dbFactory from '#db/couchdb/base'
import { minKey, maxKey } from '#lib/couch'
import { assert_ } from '#lib/utils/assert_types'
import { createNotificationDoc, markNotificationDocAsRead } from '#models/notification'

const db = await dbFactory('notifications')

export function getNotificationsByUserId (userId) {
  assert_.string(userId)
  return db.getDocsByViewQuery('byUserAndTime', {
    startkey: [ userId, maxKey ],
    endkey: [ userId, minKey ],
    include_docs: true,
    descending: true,
  })
}

// Make notifications accessible by the subjects they involve:
// user, group, item etc
export function getNotificationsBySubject (subjectId) {
  return db.getDocsByViewKey('bySubject', subjectId)
}

export function createNotification (user, type, data) {
  const doc = createNotificationDoc({ user, type, data })
  return db.post(doc)
}

export async function updateNotificationReadStatus (userId, times) {
  assert_.string(userId)
  assert_.numbers(times)
  const keys = times.map(time => [ userId, time ])
  const docs = await db.getDocsByViewKeys('byUserAndTime', keys)
  docs.forEach(markNotificationDocAsRead)
  return db.bulk(docs)
}

export function deleteAllNotificationsBySubjectId (subjectId) {
  // You absolutly don't want this id to be undefined
  // as this would end up deleting the whole database
  assert_.string(subjectId)
  return getNotificationsBySubject(subjectId)
  .then(db.bulkDelete)
}

export function getUnreadNotificationsCount (userId) {
  return getNotificationsByUserId(userId)
  .then(getUnreadCount)
}

// Alias
export const deleteAllNotificationsByUserId = deleteAllNotificationsBySubjectId

const getUnreadCount = notifs => notifs.filter(isUnread).length
const isUnread = notif => notif.status === 'unread'
