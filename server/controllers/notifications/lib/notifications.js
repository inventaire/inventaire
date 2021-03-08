const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { minKey, maxKey } = __.require('lib', 'couch')
const assert_ = __.require('utils', 'assert_types')
const Notification = __.require('models', 'notification')
const db = __.require('db', 'couchdb/base')('notifications')

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
  }
}

// Alias
notifications_.deleteAllByUserId = notifications_.deleteAllBySubjectId

const getUnreadCount = notifs => notifs.filter(isUnread).length
const isUnread = notif => notif.status === 'unread'
