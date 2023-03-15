import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import { emit } from '#lib/radio'
import Group from '#models/group'

const db = dbFactory('groups')

let getGroupById, getGroupsByUser
const importCircularDependencies = async () => {
  ({ getGroupById, getGroupsByUser } = await import('./groups.js'))
}
setImmediate(importCircularDependencies)

export const userCanLeaveGroup = async (userId, groupId) => {
  const group = await getGroupById(groupId)
  const { admins, members } = group
  const adminsIds = admins.map(_.property('user'))
  if (!adminsIds.includes(userId)) return true
  const mainUserIsTheOnlyAdmin = admins.length === 1
  const thereAreOtherMembers = members.length > 0
  if (mainUserIsTheOnlyAdmin && thereAreOtherMembers) return false
  else return true
}

export async function leaveAllGroups (userId) {
  const groups = await getGroupsByUser(userId)
  return Promise.all(groups.map(group => removeUser(group, userId)))
}

async function removeUser (group, userId) {
  const updatedGroup = Group.deleteUser(group, userId)
  await db.put(updatedGroup)
  await emit('group:leave', group._id, userId)
}
