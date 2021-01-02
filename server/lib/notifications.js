const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const radio = __.require('lib', 'radio')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const { minKey, maxKey } = __.require('lib', 'couch')
const assert_ = __.require('utils', 'assert_types')
const Notification = __.require('models', 'notification')

const db = __.require('couch', 'base')('notifications')

const notifications_ = module.exports = {
  byUserId: userId => {
    assert_.string(userId)
    return db.viewCustom('byUserAndTime', {
      startkey: [ userId, maxKey ],
      endkey: [ userId, minKey ],
      include_docs: true,
      descending: true,
    })
    .catch(_.ErrorRethrow('byUserId'))
  },

  // Make notifications accessible by the subjects they involve:
  // user, group, item etc
  bySubject: subjectId => {
    return db.viewByKey('bySubject', subjectId)
    .catch(_.ErrorRethrow('bySubject'))
  },

  add: (user, type, data) => {
    const doc = Notification.create({ user, type, data })
    return db.post(doc)
  },

  bulkAddOrUpdate: bulk => {
    assert_.array(bulk)
    // Allow to pass a mix of existing notification docs or
    const docs = bulk.map(data => {
      if (data._id != null) return Notification.update(data)
      else return Notification.create(data)
    })
    return db.bulk(docs)
  },

  updateReadStatus: (userId, time) => {
    time = Number(time)
    return db.viewFindOneByKey('byUserAndTime', [ userId, time ])
    .then(doc => db.update(doc._id, BasicUpdater('status', 'read')))
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
  }
}

// Alias
notifications_.deleteAllByUserId = notifications_.deleteAllBySubjectId

const getUnreadCount = notifs => notifs.filter(isUnread).length
const isUnread = notif => notif.status === 'unread'

const callbacks = {
  acceptedRequest: (userToNotify, newFriend) => {
    assert_.strings([ userToNotify, newFriend ])
    return notifications_.add(userToNotify, 'friendAcceptedRequest', {
      user: newFriend
    })
  },

  userMadeAdmin: (groupId, actorAdminId, newAdminId) => {
    return notifications_.add(newAdminId, 'userMadeAdmin', {
      group: groupId,
      user: actorAdminId
    })
  },

  groupUpdate: async data => {
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
  },

  // Deleting notifications when their subject is deleted
  // to avoid having notification triggering requests for deleted resources
  deleteNotifications: (label, subjectId) => {
    assert_.strings([ label, subjectId ])
    _.log(`deleting ${label} notifications`)
    return notifications_.deleteAllBySubjectId(subjectId)
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

const groupAttributeWithNotification = [
  'name',
  'description',
  'searchable',
  'open',
]

radio.on('notify:friend:request:accepted', callbacks.acceptedRequest)
radio.on('group:makeAdmin', callbacks.userMadeAdmin)
radio.on('group:update', callbacks.groupUpdate)

radio.on('resource:destroyed', callbacks.deleteNotifications)
