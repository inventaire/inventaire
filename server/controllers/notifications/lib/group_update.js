const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const db = __.require('couch', 'base')('notifications')
const notifications_ = require('./notifications')

const groupAttributeWithNotification = [
  'name',
  'description',
  'searchable',
  'open',
]

module.exports = async data => {
  const { attribute } = data
  if (groupAttributeWithNotification.includes(attribute)) {
    const { usersToNotify, groupId, actorId, previousValue, newValue } = data
    const existingNotificationsByUsers = await getUnreadGroupNotificationsByUsers({ groupId, attribute })
    // creates a lot of similar documents:
    // could be refactored to use a single document
    // including a read status per-user: { user: id, read: boolean }
    const bulk = usersToNotify.map(userToNotify => {
      const existingNotification = existingNotificationsByUsers[userToNotify]
      if (existingNotification) {
        if (existingNotification.data.previousValue === newValue) {
          existingNotification._deleted = true
          return existingNotification
        } else {
          existingNotification.data.newValue = newValue
          return existingNotification
        }
      } else {
        return {
          user: userToNotify,
          type: 'groupUpdate',
          data: {
            group: groupId,
            user: actorId,
            attribute,
            previousValue,
            newValue
          }
        }
      }
    })
    return notifications_.bulkAddOrUpdate(bulk)
  }
}

const getUnreadGroupNotificationsByUsers = async ({ groupId, attribute }) => {
  const { docs } = await db.find({
    selector: {
      'data.group': groupId,
      'data.attribute': attribute
    },
    use_index: [ 'groups_notifications', 'unreadNotificationsByGroupAndAttribute' ],
  })

  return _.keyBy(docs, 'user')
}
