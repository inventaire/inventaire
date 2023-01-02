import { getGroupById } from '#controllers/groups/lib/groups'
import { getUsersByIds } from '#controllers/user/lib/user'
import Group from '#models/group'

export default async (groupId, reqUserId) => {
  const group = await getGroupById(groupId)
  const membersIds = Group.getAllMembersIds(group)
  const users = await getUsersByIds(membersIds)
  return {
    users,
    reqUserId,
    filter: 'group',
    feedOptions: {
      title: group.name,
      description: group.description,
      image: group.picture,
      queryString: `group=${group._id}`,
      pathname: `groups/${group._id}`,
    },
  }
}
