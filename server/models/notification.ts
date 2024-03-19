import validations from './validations/notification.js'

export function createNotificationDoc ({ user, type, data }) {
  validations.pass('userId', user)
  validations.pass('type', type)
  validations.pass('data', data, { type })

  const doc = {
    user,
    type,
    data,
    status: 'unread',
    time: Date.now(),
  }

  return doc
}

export function updateNotificationDoc (doc) {
  validations.pass('doc _id', doc._id)
  validations.pass('userId', doc.user)
  validations.pass('type', doc.type)
  validations.pass('data', doc.data, { type: doc.type })

  doc.time = Date.now()
  return doc
}

export function markNotificationDocAsRead (doc) {
  doc.status = 'read'
  return doc
}
