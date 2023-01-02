import { property, sum } from 'lodash-es'
import { getGroupsByAdmin, getGroupsByInvitedUser } from '#controllers/groups/lib/groups'

export const pendingGroupInvitationsCount = async userId => {
  const { length } = await getGroupsByInvitedUser(userId)
  return length
}

export const pendingGroupRequestsCount = async userId => {
  const groups = await getGroupsByAdmin(userId)
  return sum(groups.map(property('requested.length')))
}
