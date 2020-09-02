const __ = require('config').universalPath
const { areFriendsOrGroupCoMembers } = __.require('controllers', 'user/lib/relations_status')
const groups_ = __.require('controllers', 'groups/lib/groups')

// Return what the reqUserId user is allowed to see from a user or a group inventory
module.exports = {
  byUser: (userId, reqUserId, dry) => {
    if (userId === reqUserId) return Promise.resolve(wrap('private', [ userId ]))
    if (!reqUserId) return Promise.resolve(wrap('public', [ userId ], dry))

    return areFriendsOrGroupCoMembers(userId, reqUserId)
    .then(usersAreFriendsOrGroupCoMembers => {
      if (usersAreFriendsOrGroupCoMembers) return wrap('network', [ userId ], dry)
      else return wrap('public', [ userId ], dry)
    })
  },

  byGroup: (groupId, reqUserId, dry) => {
    return groups_.getGroupMembersIds(groupId)
    .then(allGroupMembers => {
      if (reqUserId && allGroupMembers.includes(reqUserId)) return wrap('network', allGroupMembers, dry)
      else return wrap('public', allGroupMembers, dry)
    })
  }
}

const wrap = (authorizationLevel, usersIds, dry) => ({ authorizationLevel, usersIds, dry })
