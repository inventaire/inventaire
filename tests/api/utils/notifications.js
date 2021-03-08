const __ = require('config').universalPath
const { customAuthReq } = require('./utils')
const assert_ = __.require('lib', 'utils/assert_types')

module.exports = {
  getNotifications: async ({ user, type, subject }) => {
    assert_.object(user)
    assert_.string(type)
    assert_.string(subject)
    const { notifications } = await customAuthReq(user, 'get', '/api/notifications?limit=50')
    return notifications.filter(notification => {
      return notification.type === type && getSubjectId(notification) === subject
    })
  }
}

const getSubjectId = ({ type, data }) => {
  if (type === 'groupUpdate' || type === 'userMadeAdmin') return data.group
  else return data.user
}
