import { authReq, getUser, customAuthReq } from './utils'

const getGroup = async group => {
  group = await group
  const { group: refreshedGroup } = await authReq('get', `/api/groups?action=by-id&id=${group._id}`)
  return refreshedGroup
}

const updateGroup = async ({ group, user, attribute, value }) => {
  user = user || (await getUser())
  return customAuthReq(user, 'put', '/api/groups?action=update-settings', {
    group: group._id,
    attribute,
    value
  })
}

export default {
  getGroup,
  updateGroup,
}
