import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import Notification from '#models/notification'

const db = dbFactory('notifications')

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
    _.error(err, 'group update notification error')
  }
}

const getNotificationUpdateOrCreation = (data, existingNotificationsByUsers) => userToNotify => {
  const existingNotification = existingNotificationsByUsers[userToNotify]
  if (existingNotification) return getNotificationUpdate(existingNotification, data.newValue)
  else return getNewNotification(userToNotify, data)
}

const getNewNotification = (userToNotify, data) => {
  const { groupId, actorId, attribute, previousValue, newValue } = data
  return Notification.create({
    user: userToNotify,
    type: 'groupUpdate',
    data: {
      group: groupId,
      user: actorId,
      attribute,
      previousValue,
      newValue
    }
  })
}

const getNotificationUpdate = (existingNotification, newValue) => {
  if (existingNotification.data.previousValue === newValue) {
    existingNotification._deleted = true
  } else {
    existingNotification.data.newValue = newValue
  }
  return Notification.update(existingNotification)
}

const getUnreadGroupNotificationsByUsers = async ({ groupId, attribute }) => {
  const key = [ groupId, attribute ]
  const docs = await db.viewByKeys('unreadNotificationsByGroupAndAttribute', [ key ])
  return _.keyBy(docs, 'user')
}
