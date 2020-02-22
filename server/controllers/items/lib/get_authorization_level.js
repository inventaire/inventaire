const __ = require('config').universalPath
const { areFriendsOrGroupCoMembers } = __.require('controllers', 'user/lib/relations_status')
const groups_ = __.require('controllers', 'groups/lib/groups')

// Return what the reqUserId user is allowed to see from a user or a group inventory
module.exports = {
  byUser: (userId, reqUserId) => {
    if (userId === reqUserId) return Promise.resolve(wrap('private', [ userId ]))
    if (!reqUserId) return Promise.resolve(wrap('public', [ userId ]))

    return areFriendsOrGroupCoMembers(userId, reqUserId)
    .then(usersAreFriendsOrGroupCoMembers => {
      if (usersAreFriendsOrGroupCoMembers) return wrap('network', [ userId ])
      else return wrap('public', [ userId ])
    })
  },

  byGroup: (groupId, reqUserId) => {
    return groups_.getGroupMembersIds(groupId)
    .then(allGroupMembers => {
      if (reqUserId && allGroupMembers.includes(reqUserId)) return wrap('network', allGroupMembers)
      else return wrap('public', allGroupMembers)
    })
  }
}

const wrap = (authorizationLevel, usersIds) => ({ authorizationLevel, usersIds })
