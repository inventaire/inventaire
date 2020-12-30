const validations = require('./validations/notification')

module.exports = {
  create: ({ user, type, data }) => {
    validations.pass('userId', user)
    validations.pass('type', type)
    validations.pass('data', data, { type })

    const doc = {
      user,
      type,
      data,
      status: 'unread',
      time: Date.now()
    }

    return doc
  }
}
