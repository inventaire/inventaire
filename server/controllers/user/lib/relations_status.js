const _ = require('builders/utils')
const groups_ = require('controllers/groups/lib/groups')
const relations_ = require('controllers/relations/lib/queries')
const assert_ = require('lib/utils/assert_types')

module.exports = {
  getUserRelations: userId => {
    // just proxiing to let this module centralize
    // interactions with the social graph
    return relations_.getUserRelations(userId)
  },

  areFriendsOrGroupCoMembers: (userId, otherId) => {
    assert_.strings([ userId, otherId ])
    return getFriendsAndGroupCoMembers(userId)
    .then(([ friendsIds, coGroupMembersIds ]) => friendsIds.includes(otherId) || coGroupMembersIds.includes(otherId))
  },

  getNetworkIds: async userId => {
    if (userId == null) return []
    return getFriendsAndGroupCoMembers(userId)
    .then(_.flatten)
  },
}

const getFriendsAndGroupCoMembers = userId => Promise.all([
  relations_.getUserFriends(userId),
  groups_.getUserGroupsCoMembers(userId)
])
