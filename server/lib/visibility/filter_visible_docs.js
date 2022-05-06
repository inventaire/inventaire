const _ = require('builders/utils')
const { isVisibilityGroupKey } = require('lib/boolean_validations')
const { byIds: getGroupsByIds, getUserGroupsCoMembers } = require('controllers/groups/lib/groups')
const { getUserFriends } = require('controllers/relations/lib/lists')
const { allGroupMembers: parseAllGroupMembersIds } = require('server/controllers/groups/lib/users_lists')

module.exports = async (docs, reqUserId) => {
  if (!reqUserId) return docs.filter(isPublic)

  // Optimizing for the case where all requested docs belong to the requester
  // as that's a frequent case
  if (docs.every(belongToRequester(reqUserId))) return docs

  const [
    friendsIds = [],
    groups = [],
    coGroupsMembersIds = [],
  ] = await getMinimalRequiredUserNetworkData(docs, reqUserId)

  const groupsMembersIdsSets = getGroupsMembersIdsSets(groups)
  return docs.filter(isVisible({ friendsIds, coGroupsMembersIds, groupsMembersIdsSets, reqUserId }))
}

const isPublic = doc => doc.visibility.includes('public')
const belongToRequester = reqUserId => doc => {
  if (doc.owner) return doc.owner === reqUserId
  if (doc.user) return doc.user === reqUserId
}

const getMinimalRequiredUserNetworkData = async (docs, reqUserId) => {
  const allVisibilityKeys = _.uniq(_.map(docs, 'visibility').flat())

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

const keyRequiresFriendsIds = key => key === 'friends'
const keyRequiresGroupsCoMembers = key => key === 'groups'

const isVisible = ({ friendsIds, coGroupsMembersIds, groupsMembersIdsSets, reqUserId }) => doc => {
  const { user, owner, visibility } = doc
  // known cases : shelf.owner or list.user
  const docUserId = owner || user
  if (docUserId === reqUserId) return true
  if (visibility.includes('public')) return true
  if (visibility.includes('groups') && coGroupsMembersIds.includes(docUserId)) return true
  if (visibility.includes('friends') && friendsIds.includes(docUserId)) return true
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
