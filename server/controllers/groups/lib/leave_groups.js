const _ = require('builders/utils')
const Group = require('models/group')
const db = require('db/couchdb/base')('groups')
const promises_ = require('lib/promises')

let groups_
const requireCircularDependencies = () => { groups_ = require('./groups') }
setImmediate(requireCircularDependencies)

module.exports = {
  userCanLeave: (userId, groupId) => {
    return groups_.byId(groupId)
    .then(group => {
      const { admins, members } = group
      const adminsIds = admins.map(_.property('user'))
      if (!adminsIds.includes(userId)) return true
      const mainUserIsTheOnlyAdmin = admins.length === 1
      const thereAreOtherMembers = members.length > 0
      if (mainUserIsTheOnlyAdmin && thereAreOtherMembers) return false
      else return true
    })
  },

  leaveAllGroups: userId => {
    return groups_.byUser(userId)
    .then(promises_.map(group => removeUser(group, userId)))
  }
}

const removeUser = (group, userId) => {
  const updatedGroup = Group.deleteUser(group, userId)
  if (updatedGroup.admins.length === 0) return db.delete(group._id, group._rev)
  else return db.put(updatedGroup)
}
