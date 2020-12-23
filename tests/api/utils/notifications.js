const __ = require('config').universalPath
const { customAuthReq } = require('./utils')
const assert_ = __.require('utils', 'assert_types')
const endpoint = '/api/notifications'

module.exports = {
  getNotifications: async ({ user, type }) => {
    assert_.object(user)
    assert_.string(type)
    const { notifications } = await customAuthReq(user, 'get', endpoint)
    return notifications.filter(notification => notification.type === type)
  }
}
