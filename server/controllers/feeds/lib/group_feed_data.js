import user_ from 'controllers/user/lib/user'
import groups_ from 'controllers/groups/lib/groups'
import Group from 'models/group'

export default async (groupId, reqUserId) => {
  const group = await groups_.byId(groupId)
  const membersIds = Group.getAllMembersIds(group)
  const users = await user_.byIds(membersIds)
  return {
    users,
    reqUserId,
    filter: 'group',
    feedOptions: {
      title: group.name,
      description: group.description,
      image: group.picture,
      queryString: `group=${group._id}`,
      pathname: `groups/${group._id}`
    }
  }
}
