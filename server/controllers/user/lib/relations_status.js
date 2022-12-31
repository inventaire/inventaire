import _ from 'builders/utils'
import { intersection } from 'lodash'
import groups_, { getUsersGroupsIds } from 'controllers/groups/lib/groups'
import relations_ from 'controllers/relations/lib/queries'

export default {
  getUserRelations: userId => {
    // just proxiing to let this module centralize
    // interactions with the social graph
    return relations_.getUserRelations(userId)
  },

  areFriends: async (userId, otherId) => {
    const relationStatus = await relations_.getStatus(userId, otherId)
    return relationStatus === 'friends'
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
