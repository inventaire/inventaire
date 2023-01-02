import { intersection } from 'lodash-es'
import _ from '#builders/utils'
import { getUserGroupsCoMembers, getUsersGroupsIds } from '#controllers/groups/lib/groups'
import { getUserFriends } from '#controllers/relations/lib/lists'
import { getRelationStatus } from '#controllers/relations/lib/queries'

export async function areFriends (userId, otherId) {
  const relationStatus = await getRelationStatus(userId, otherId)
  return relationStatus === 'friends'
}

export async function getSharedGroupsIds (userAId, userBId) {
  const { [userAId]: aGroupsIds, [userBId]: bGroupsIds } = await getUsersGroupsIds([ userAId, userBId ])
  return intersection(aGroupsIds, bGroupsIds)
}

export async function getNetworkIds (userId) {
  if (userId == null) return []
  return getFriendsAndGroupCoMembers(userId)
  .then(_.flatten)
}

const getFriendsAndGroupCoMembers = userId => Promise.all([
  getUserFriends(userId),
  getUserGroupsCoMembers(userId),
])
