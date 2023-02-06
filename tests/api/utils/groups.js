import { customAuthReq } from '#tests/api/utils/request'
import { authReq, getUser } from './utils.js'

export async function getGroup (group) {
  group = await group
  const { group: refreshedGroup } = await authReq('get', `/api/groups?action=by-id&id=${group._id}`)
  return refreshedGroup
}

export async function updateGroup ({ group, user, attribute, value }) {
  user = user || (await getUser())
  return customAuthReq(user, 'put', '/api/groups?action=update-settings', {
    group: group._id,
    attribute,
    value,
  })
}
