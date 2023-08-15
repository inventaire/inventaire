import { property, sum } from 'lodash-es'
import { getGroupsWhereUserIsAdmin, getGroupsWhereUserIsInvited } from '#controllers/groups/lib/groups'

export const getPendingGroupInvitationsCount = async userId => {
  const groups = await getGroupsWhereUserIsInvited(userId)
  return groups.length
}

export const getPendingGroupRequestsCount = async userId => {
  const groups = await getGroupsWhereUserIsAdmin(userId)
  return sum(groups.map(property('requested.length')))
}
