const _ = require('builders/utils')
const { intersection } = require('lodash')
const { getUsersGroupsIds } = require('controllers/groups/lib/groups')
const groups_ = require('controllers/groups/lib/groups')
const relations_ = require('controllers/relations/lib/queries')
const assert_ = require('lib/utils/assert_types')

const areFriends = async (userId, otherId) => {
  const relationStatus = await relations_.getStatus(userId, otherId)
  return relationStatus === 'friends'
}

const areGroupsCoMembers = async (userId, otherId) => {
  const coGroupMembersIds = await groups_.getUserGroupsCoMembers(userId)
  return coGroupMembersIds.includes(otherId)
}

module.exports = {
  getUserRelations: userId => {
    // just proxiing to let this module centralize
    // interactions with the social graph
    return relations_.getUserRelations(userId)
  },

  areFriends,

  areFriendsOrGroupCoMembers: async (userId, otherId) => {
    assert_.strings([ userId, otherId ])
    const { a, b } = await Promise.all([
      areFriends(userId, otherId),
      areGroupsCoMembers(userId, otherId),
    ])
    return a || b
  },

  getSharedGroupsIds: async (userAId, userBId) => {
    const { [userAId]: aGroupsIds, [userBId]: bGroupsIds } = await getUsersGroupsIds([ userAId, userBId ])
    return intersection(aGroupsIds, bGroupsIds)
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
