import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import { mappedArrayPromise } from '#lib/promises'
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

export const leaveAllGroups = async userId => {
  return getGroupsByUser(userId)
  .then(mappedArrayPromise(group => removeUser(group, userId)))
}

const removeUser = (group, userId) => {
  const updatedGroup = Group.deleteUser(group, userId)
  if (updatedGroup.admins.length === 0) return db.delete(group._id, group._rev)
  else return db.put(updatedGroup)
}
