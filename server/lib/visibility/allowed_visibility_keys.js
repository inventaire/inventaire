import { areFriends, getSharedGroupsIds } from '#controllers/user/lib/relations_status'
import { getGroupVisibilityKey } from '#lib/visibility/visibility'

const getAllowedVisibilityKeys = async (userId, reqUserId) => {
  // This special case should be handled by consumers
  if (userId === reqUserId) return [ 'private' ]

  const keys = [ 'public' ]

  if (!reqUserId) return keys

  const [ usersAreFriends, sharedGroupsIds ] = await Promise.all([
    areFriends(userId, reqUserId),
    getSharedGroupsIds(userId, reqUserId),
  ])
  if (usersAreFriends) keys.push('friends')
  if (sharedGroupsIds.length > 0) keys.push('groups', ...sharedGroupsIds.map(getGroupVisibilityKey))

  return keys
}

export default {
  getAllowedVisibilityKeys,
}
