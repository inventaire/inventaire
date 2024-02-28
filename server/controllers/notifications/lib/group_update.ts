import { keyBy } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { logError } from '#lib/utils/logs'
import { createNotificationDoc, updateNotificationDoc } from '#models/notification'

const db = await dbFactory('notifications')

const groupAttributeWithNotification = [
  'name',
  'description',
  'searchable',
  'open',
]

export default async data => {
  try {
    const { attribute } = data
    if (!groupAttributeWithNotification.includes(attribute)) return

    const { usersToNotify, groupId } = data
    const existingNotificationsByUsers = await getUnreadGroupNotificationsByUsers({ groupId, attribute })
    const docs = usersToNotify.map(getNotificationUpdateOrCreation(data, existingNotificationsByUsers))
    await db.bulk(docs)
  } catch (err) {
    logError(err, 'group update notification error')
  }
}

const getNotificationUpdateOrCreation = (data, existingNotificationsByUsers) => userToNotify => {
  const existingNotification = existingNotificationsByUsers[userToNotify]
  if (existingNotification) return getNotificationUpdate(existingNotification, data.newValue)
  else return getNewNotification(userToNotify, data)
}

const getNewNotification = (userToNotify, data) => {
  const { groupId, actorId, attribute, previousValue, newValue } = data
  return createNotificationDoc({
    user: userToNotify,
    type: 'groupUpdate',
    data: {
      group: groupId,
      user: actorId,
      attribute,
      previousValue,
      newValue,
    },
  })
}

const getNotificationUpdate = (existingNotification, newValue) => {
  if (existingNotification.data.previousValue === newValue) {
    existingNotification._deleted = true
  } else {
    existingNotification.data.newValue = newValue
  }
  return updateNotificationDoc(existingNotification)
}

const getUnreadGroupNotificationsByUsers = async ({ groupId, attribute }) => {
  const key = [ groupId, attribute ]
  const docs = await db.viewByKeys('unreadNotificationsByGroupAndAttribute', [ key ])
  return keyBy(docs, 'user')
}
