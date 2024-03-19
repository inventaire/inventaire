import { property } from 'lodash-es'
import { getGroupById, getGroupsWhereUserHasAnyRole } from '#controllers/groups/lib/groups'
import dbFactory from '#db/couchdb/base'
import { emit } from '#lib/radio'
import { removeUserFromGroupDoc } from '#models/group'

const db = await dbFactory('groups')

export async function userCanLeaveGroup (userId, groupId) {
  const group = await getGroupById(groupId)
  const { admins, members } = group
  const adminsIds = admins.map(property('user'))
  if (!adminsIds.includes(userId)) return true
  const mainUserIsTheOnlyAdmin = admins.length === 1
  const thereAreOtherMembers = members.length > 0
  if (mainUserIsTheOnlyAdmin && thereAreOtherMembers) return false
  else return true
}

export async function leaveAllGroups (userId) {
  const groups = await getGroupsWhereUserHasAnyRole(userId)
  return Promise.all(groups.map(group => removeUser(group, userId)))
}

async function removeUser (group, userId) {
  const updatedGroup = removeUserFromGroupDoc(group, userId)
  await db.put(updatedGroup)
  await emit('group:leave', group._id, userId)
}
