const _ = require('builders/utils')
const { isVisibilityGroupKey } = require('lib/boolean_validations')
const { byIds: getGroupsByIds, getUserGroupsCoMembers } = require('controllers/groups/lib/groups')
const { getUserFriends } = require('controllers/relations/lib/lists')
const { allGroupMembers: parseAllGroupMembersIds } = require('server/controllers/groups/lib/users_lists')

module.exports = async (shelves, reqUserId) => {
  // Optimizing for the case where all requested shelves belong to the requester
  // as that's a frequent case
  if (shelvesOwnerRequest(shelves, reqUserId)) return shelves

  const [
    groups = [],
    friendsIds = [],
    coGroupsMembersIds = [],
  ] = await getMinimalRequiredUserNetworkData(shelves, reqUserId)

  const groupsMembersIds = getGroupsMembersIdsSets(groups)
  return shelves.filter(isVisible({ friendsIds, coGroupsMembersIds, groupsMembersIds, reqUserId }))
}

const shelvesOwnerRequest = (shelves, reqUserId) => {
  const ownersIds = _.uniq(_.map(shelves, 'owner'))
  return (ownersIds.length === 1 && ownersIds[0] === reqUserId)
}

const getMinimalRequiredUserNetworkData = async (shelves, reqUserId) => {
  const allVisibilityKeys = _.uniq(_.map(shelves, 'visibility').flat())

  const groupsIds = allVisibilityKeys.filter(isVisibilityGroupKey).map(getGroupIdFromKey)
  let groupsPromise
  if (groupsIds.length > 0) {
    groupsPromise = getGroupsByIds(groupsIds)
  }

  const needToFetchFriends = allVisibilityKeys.some(keyRequiresFriendsIds)
  let friendsIdsPromise
  if (needToFetchFriends) {
    friendsIdsPromise = getUserFriends(reqUserId)
  }

  const needToFetchGroupsCoMembers = allVisibilityKeys.some(keyRequiresGroupsCoMembers)
  let coGroupsMembersIdsPromise
  if (needToFetchGroupsCoMembers) {
    coGroupsMembersIdsPromise = getUserGroupsCoMembers(reqUserId)
  }

  return Promise.all([ groupsPromise, friendsIdsPromise, coGroupsMembersIdsPromise ])
}

const getGroupsMembersIdsSets = groups => {
  const groupsMembersIds = {}
  for (const group of groups) {
    groupsMembersIds[group._id] = new Set(parseAllGroupMembersIds(group))
  }
  return groupsMembersIds
}

const keyRequiresFriendsIds = key => key === 'network' || key === 'friends'
const keyRequiresGroupsCoMembers = key => key === 'network'

const isVisible = ({ friendsIds, coGroupsMembersIds, groupsMembersIds, reqUserId }) => shelf => {
  const { owner, visibility } = shelf
  if (owner === reqUserId) return true
  if (visibility.includes('public')) return true
  if (visibility.includes('network')) {
    if (friendsIds.includes(owner) || coGroupsMembersIds.includes(owner)) {
      return true
    }
  }
  if (visibility.includes('friends') && friendsIds.includes(owner)) return true
  for (const key of visibility) {
    if (isVisibilityGroupKey(key)) {
      const groupId = getGroupIdFromKey(key)
      const membersIdsSet = groupsMembersIds[groupId]
      if (membersIdsSet.has(reqUserId)) return true
    }
  }
  return false
}

const getGroupIdFromKey = key => key.split(':')[1]
