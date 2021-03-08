const __ = require('config').universalPath
const user_ = require('controllers/user/lib/user')
const groups_ = require('controllers/groups/lib/groups')
const Group = require('models/group')

module.exports = async (groupId, reqUserId) => {
  const group = await groups_.byId(groupId)
  const membersIds = Group.getAllMembersIds(group)
  const users = await user_.byIds(membersIds)
  return {
    users,

    // Give access to semi-private ('network') items only if the requester
    // is a group member
    accessLevel: membersIds.includes(reqUserId) ? 'network' : 'public',

    feedOptions: {
      title: group.name,
      description: group.description,
      image: group.picture,
      queryString: `group=${group._id}`,
      pathname: `groups/${group._id}`
    }
  }
}
