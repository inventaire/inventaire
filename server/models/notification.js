const validations = require('./validations/notification')

module.exports = {
  create: ({ userId, type, data }) => {
    validations.pass('userId', userId)
    validations.pass('type', type)
    validations.pass('data', data, { type })

    const doc = {
      user: userId,
      type,
      data,
      status: 'unread',
      time: Date.now()
    }

    return doc
  }
}
