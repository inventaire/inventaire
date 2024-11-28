import { intersection } from 'lodash-es'
import { getUserGroupsCoMembers, getGroupsIdsWhereUsersAreAdminsOrMembers } from '#controllers/groups/lib/groups'
import { getUserFriends } from '#controllers/relations/lib/lists'
import { getRelationStatus } from '#controllers/relations/lib/queries'
import type { UserId } from '#types/user'

export async function areFriends (userId: UserId, otherId: UserId) {
  const relationStatus = await getRelationStatus(userId, otherId)
  return relationStatus === 'friends'
}

export async function getSharedGroupsIds (userAId: UserId, userBId: UserId) {
  const { [userAId]: aGroupsIds, [userBId]: bGroupsIds } = await getGroupsIdsWhereUsersAreAdminsOrMembers([ userAId, userBId ])
  return intersection(aGroupsIds, bGroupsIds)
}

export async function getNetworkIds (userId: UserId) {
  if (userId == null) return []
  const ids = await Promise.all([
    getUserFriends(userId),
    getUserGroupsCoMembers(userId),
  ])
  return ids.flat() as UserId[]
}
