const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const groups_ = __.require('controllers', 'groups/lib/groups')
const relations_ = __.require('controllers', 'relations/lib/queries')
const assert_ = __.require('lib', 'utils/assert_types')

module.exports = {
  getUserRelations: userId => {
    // just proxiing to let this module centralize
    // interactions with the social graph
    return relations_.getUserRelations(userId)
  },

  getRelationsStatuses: async (userId, usersIds) => {
    if (userId == null) return [ [], [], usersIds ]

    return getFriendsAndGroupCoMembers(userId)
    .then(spreadRelations(usersIds))
  },

  // // Not used at the moment
  // areFriends: (userId, otherId) => {
  //   assert_.strings([ userId, otherId ])
  //   return relations_.getStatus(userId, otherId)
  //   .then(status => status === 'friends')
  // },

  areFriendsOrGroupCoMembers: (userId, otherId) => {
    assert_.strings([ userId, otherId ])
    return getFriendsAndGroupCoMembers(userId)
    .then(([ friendsIds, coGroupMembersIds ]) => friendsIds.includes(otherId) || coGroupMembersIds.includes(otherId))
  },

  getNetworkIds: async userId => {
    if (userId == null) return []
    return getFriendsAndGroupCoMembers(userId)
    .then(_.flatten)
  }
}

const spreadRelations = usersIds => ([ friendsIds, coGroupMembersIds ]) => {
  const friends = []
  const coGroupMembers = []
  const publik = []

  for (const id of usersIds) {
    if (friendsIds.includes(id)) {
      friends.push(id)
    } else if (coGroupMembersIds.includes(id)) {
      coGroupMembers.push(id)
    } else {
      publik.push(id)
    }
  }

  return [ friends, coGroupMembers, publik ]
}

const getFriendsAndGroupCoMembers = userId => Promise.all([
  relations_.getUserFriends(userId),
  groups_.findUserGroupsCoMembers(userId)
])
