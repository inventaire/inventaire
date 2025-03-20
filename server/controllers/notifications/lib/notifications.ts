import { dbFactory } from '#db/couchdb/base'
import { minKey, maxKey } from '#lib/couch'
import { assertString } from '#lib/utils/assert_types'
import { createNotificationDoc, markNotificationDocAsRead } from '#models/notification'
import type { Notification } from '#types/notification'
import type { UserId } from '#types/user'

const db = await dbFactory('notifications')

export function getNotificationsByUserId (userId) {
  assertString(userId)
  return db.getDocsByViewQuery<Notification>('byUserAndTime', {
    startkey: [ userId, maxKey ],
    endkey: [ userId, minKey ],
    include_docs: true,
    descending: true,
  })
}

// Make notifications accessible by the subjects they involve:
// user, group, item etc
export function getNotificationsBySubject (subjectId) {
  return db.getDocsByViewKey<Notification>('bySubject', subjectId)
}

export function createNotification (user, type, data) {
  const doc = createNotificationDoc({ user, type, data })
  return db.post(doc)
}

export async function updateNotificationReadStatus (userId: UserId, times: number[]) {
  const keys = times.map(time => [ userId, time ])
  const docs = await db.getDocsByViewKeys<Notification>('byUserAndTime', keys)
  docs.forEach(markNotificationDocAsRead)
  return db.bulk(docs)
}

export function deleteAllNotificationsBySubjectId (subjectId) {
  // You absolutly don't want this id to be undefined
  // as this would end up deleting the whole database
  assertString(subjectId)
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
