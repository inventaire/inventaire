import { customAuthReq } from './utils'
import assert_ from 'lib/utils/assert_types'

export default {
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
