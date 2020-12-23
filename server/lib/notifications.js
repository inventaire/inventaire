const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const radio = __.require('lib', 'radio')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const { minKey, maxKey } = __.require('lib', 'couch')
const assert_ = __.require('utils', 'assert_types')

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

  add: (userId, type, data) => {
    assert_.string(userId)
    assert_.string(type)
    assert_.object(data)
    return db.post({
      user: userId,
      type,
      data,
      status: 'unread',
      time: Date.now()
    })
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

  groupUpdate: data => {
    const { attribute } = data
    if (groupAttributeWithNotification.includes(attribute)) {
      const { usersToNotify, groupId, actorId, previousValue, newValue } = data
      // creates a lot of similar documents:
      // could be refactored to use a single document
      // including a read status per-user: { user: id, read: boolean }
      return usersToNotify.map(userToNotify => {
        return notifications_.add(userToNotify, 'groupUpdate', {
          group: groupId,
          user: actorId,
          attribute,
          previousValue,
          newValue
        })
      })
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
