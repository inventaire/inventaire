import { getGroupById } from '#controllers/groups/lib/groups'
import { getUsersByIds } from '#controllers/user/lib/user'
import { getGroupVisibilityKey } from '#lib/visibility/visibility'
import { getAllGroupDocMembersIds } from '#models/group'
import type { GroupId } from '#types/group'
import type { UserId } from '#types/user'

export default async function (groupId: GroupId, reqUserId: UserId) {
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
