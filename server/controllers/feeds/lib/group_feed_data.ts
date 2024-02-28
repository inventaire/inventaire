import { getGroupById } from '#controllers/groups/lib/groups'
import { getUsersByIds } from '#controllers/user/lib/user'
import { getGroupVisibilityKey } from '#lib/visibility/visibility'
import { getAllGroupDocMembersIds } from '#models/group'

export default async (groupId, reqUserId) => {
  const group = await getGroupById(groupId)
  const membersIds = getAllGroupDocMembersIds(group)
  const users = await getUsersByIds(membersIds)
  return {
    users,
    reqUserId,
    context: getGroupVisibilityKey(group._id),
    feedOptions: {
      title: group.name,
      description: group.description,
      image: group.picture,
      queryString: `group=${group._id}`,
      pathname: `groups/${group._id}`,
    },
  }
}
