const _ = require('builders/utils')
const { isVisibilityGroupKey } = require('lib/boolean_validations')
const { byIds: getGroupsByIds, getUserGroupsCoMembers } = require('controllers/groups/lib/groups')
const { getUserFriends } = require('controllers/relations/lib/lists')
const { allGroupMembers: parseAllGroupMembersIds } = require('server/controllers/groups/lib/users_lists')

module.exports = async (shelves, reqUserId) => {
  // Optimizing for the case where all requested shelves belong to the requester
  // as that's a frequent case
  if (shelves.every(isOwnedByReqUser(reqUserId))) return shelves

  const [
    friendsIds = [],
    groups = [],
    coGroupsMembersIds = [],
  ] = await getMinimalRequiredUserNetworkData(shelves, reqUserId)

  const groupsMembersIdsSets = getGroupsMembersIdsSets(groups)
  return shelves.filter(isVisible({ friendsIds, coGroupsMembersIds, groupsMembersIdsSets, reqUserId }))
}

const isOwnedByReqUser = reqUserId => shelf => shelf.owner === reqUserId

const getMinimalRequiredUserNetworkData = async (shelves, reqUserId) => {
  const allVisibilityKeys = _.uniq(_.map(shelves, 'visibility').flat())

  const needToFetchFriends = allVisibilityKeys.some(keyRequiresFriendsIds)
  let friendsIdsPromise
  if (needToFetchFriends) {
    friendsIdsPromise = getUserFriends(reqUserId)
  }

  const groupsIds = allVisibilityKeys.filter(isVisibilityGroupKey).map(getGroupIdFromKey)
  let groupsPromise
  if (groupsIds.length > 0) {
    groupsPromise = getGroupsByIds(groupsIds)
  }

  const needToFetchGroupsCoMembers = allVisibilityKeys.some(keyRequiresGroupsCoMembers)
  let coGroupsMembersIdsPromise
  if (needToFetchGroupsCoMembers) {
    coGroupsMembersIdsPromise = getUserGroupsCoMembers(reqUserId)
  }

  return Promise.all([ friendsIdsPromise, groupsPromise, coGroupsMembersIdsPromise ])
}

const getGroupsMembersIdsSets = groups => {
  const groupsMembersIdsSets = {}
  for (const group of groups) {
    groupsMembersIdsSets[group._id] = new Set(parseAllGroupMembersIds(group))
  }
  return groupsMembersIdsSets
}

const keyRequiresFriendsIds = key => key === 'network' || key === 'friends'
const keyRequiresGroupsCoMembers = key => key === 'network' || key === 'groups'

const isVisible = ({ friendsIds, coGroupsMembersIds, groupsMembersIdsSets, reqUserId }) => shelf => {
  const { owner, visibility } = shelf
  if (owner === reqUserId) return true
  if (visibility.includes('public')) return true
  if (visibility.includes('network')) {
    if (friendsIds.includes(owner) || coGroupsMembersIds.includes(owner)) {
      return true
    }
  }
  if (visibility.includes('groups') && coGroupsMembersIds.includes(owner)) return true
  if (visibility.includes('friends') && friendsIds.includes(owner)) return true
  for (const key of visibility) {
    if (isVisibilityGroupKey(key)) {
      const groupId = getGroupIdFromKey(key)
      const membersIdsSet = groupsMembersIdsSets[groupId]
      if (membersIdsSet.has(reqUserId)) return true
    }
  }
  return false
}

const getGroupIdFromKey = key => key.split(':')[1]
