import { property, sum } from 'lodash-es'
import { getGroupsWhereUserIsAdmin, getGroupsWhereUserIsInvited } from '#controllers/groups/lib/groups'

export async function getPendingGroupInvitationsCount (userId) {
  const groups = await getGroupsWhereUserIsInvited(userId)
  return groups.length
}

export async function getPendingGroupRequestsCount (userId) {
  const groups = await getGroupsWhereUserIsAdmin(userId)
  return sum(groups.map(property('requested.length')))
}
