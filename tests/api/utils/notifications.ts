import { assertObject, assertString } from '#lib/utils/assert_types'
import { } from './utils.js'
import { customAuthReq } from '#tests/api/utils/request'

export async function getNotifications ({ user, type, subject }) {
  assertObject(user)
  assertString(type)
  assertString(subject)
  const { notifications } = await customAuthReq(user, 'get', '/api/notifications?limit=50')
  return notifications.filter(notification => {
    return notification.type === type && getSubjectId(notification) === subject
  })
}

const getSubjectId = ({ type, data }) => {
  if (type === 'groupUpdate' || type === 'userMadeAdmin') return data.group
  else return data.user
}
