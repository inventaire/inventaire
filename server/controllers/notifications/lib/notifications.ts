import { dbFactory } from '#db/couchdb/base'
import { minKey, maxKey } from '#lib/couch'
import { assertString } from '#lib/utils/assert_types'
import { createNotificationDoc, markNotificationDocAsRead } from '#models/notification'
import type { Notification, NotificationByType, NotificationSubjectId } from '#types/notification'
import type { UserId } from '#types/user'

const db = await dbFactory('notifications')

export function getNotificationsByUserId (userId: UserId) {
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
export function getNotificationsBySubject (subjectId: NotificationSubjectId) {
  return db.getDocsByViewKey<Notification>('bySubject', subjectId)
}

export function createNotification <T extends Notification['type']> (user: UserId, type: T, data: NotificationByType[T]['data']) {
  const doc = createNotificationDoc({ user, type, data })
  return db.post(doc)
}

export async function updateNotificationReadStatus (userId: UserId, times: number[]) {
  const keys = times.map(time => [ userId, time ])
  const docs = await db.getDocsByViewKeys<Notification>('byUserAndTime', keys)
  docs.forEach(markNotificationDocAsRead)
  return db.bulk(docs)
}

export async function deleteAllNotificationsBySubjectId (subjectId: NotificationSubjectId) {
  // You absolutly don't want this id to be undefined
  // as this would end up deleting the whole database
  assertString(subjectId)
  const notifications = await getNotificationsBySubject(subjectId)
  return db.bulkDelete(notifications)
}

export async function getUnreadNotificationsCount (userId: UserId) {
  const notifications = await getNotificationsByUserId(userId)
  return getUnreadCount(notifications)
}

// Alias
export const deleteAllNotificationsByUserId = deleteAllNotificationsBySubjectId

const getUnreadCount = notifications => notifications.filter(isUnread).length
const isUnread = notification => notification.status === 'unread'
