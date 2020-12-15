const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Group = __.require('models', 'group')
const db = __.require('couch', 'base')('groups')
const promises_ = __.require('lib', 'promises')

// Working around the circular dependency
let groups_
const lateRequire = () => { groups_ = require('./groups') }
setTimeout(lateRequire, 0)

module.exports = {
  canLeave: (userId, groupId) => {
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
