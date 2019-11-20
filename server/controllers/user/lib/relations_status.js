
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const groups_ = __.require('controllers', 'groups/lib/groups')
const relations_ = __.require('controllers', 'relations/lib/queries')
const promises_ = __.require('lib', 'promises')
const assert_ = __.require('utils', 'assert_types')

module.exports = {
  getUserRelations: userId => {
    // just proxiing to let this module centralize
    // interactions with the social graph
    return relations_.getUserRelations(userId)
  },

  getRelationsStatuses: (userId, usersIds) => {
    if (userId == null) return promises_.resolve([ [], [], usersIds ])

    return getFriendsAndGroupCoMembers(userId)
    .spread(spreadRelations(usersIds))
  },

  areFriends: (userId, otherId) => {
    assert_.strings([ userId, otherId ])
    return relations_.getStatus(userId, otherId)
    .then(status => {
      if (status === 'friends') {
        return true
      } else {
        return false
      }
    })
  },

  areFriendsOrGroupCoMembers: (userId, otherId) => {
    assert_.strings([ userId, otherId ])
    return getFriendsAndGroupCoMembers(userId)
    .spread((friendsIds, coGroupMembersIds) => friendsIds.includes(otherId) || coGroupMembersIds.includes(otherId))
  },

  getNetworkIds: userId => {
    if (userId == null) return promises_.resolve([])
    return getFriendsAndGroupCoMembers(userId)
    .then(_.flatten)
  }
}

const spreadRelations = usersIds => (friendsIds, coGroupMembersIds) => {
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

// result is to be .spread (friendsIds, coGroupMembersIds)->
const getFriendsAndGroupCoMembers = userId => promises_.all([
  relations_.getUserFriends(userId),
  groups_.findUserGroupsCoMembers(userId)
])
