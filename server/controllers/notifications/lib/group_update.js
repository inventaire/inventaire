const _ = require('builders/utils')
const db = require('db/couchdb/base')('notifications')
const Notification = require('models/notification')

const groupAttributeWithNotification = [
  'name',
  'description',
  'searchable',
  'open',
]

module.exports = async data => {
  const { attribute } = data
  if (!groupAttributeWithNotification.includes(attribute)) return

  const { usersToNotify, groupId } = data
  const existingNotificationsByUsers = await getUnreadGroupNotificationsByUsers({ groupId, attribute })
  const docs = usersToNotify.map(getNotificationUpdateOrCreation(data, existingNotificationsByUsers))
  return db.bulk(docs)
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
