
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Group = __.require('models', 'group')

// Working around the circular dependency
let groups_
const lateRequire = () => { groups_ = require('./groups') }
setTimeout(lateRequire, 0)

module.exports = {
  userCanLeave: (userId, groupId) => {
    return groups_.byId(groupId)
    .then(group => {
      const { admins, members } = group
      const adminsIds = admins.map(_.property('user'))
      if (!adminsIds.includes(userId)) return true
      const mainUserIsTheOnlyAdmin = admins.length === 1
      const thereAreOtherMembers = members.length > 0
      if (mainUserIsTheOnlyAdmin && thereAreOtherMembers) {
        return false
      } else {
        return true
      }
    })
  },

  leaveAllGroups: userId => {
    // TODO: check if userCanLeave
    return groups_.byUser(userId)
    .map(removeUser.bind(null, userId))
    .then(groups_.db.bulk)
  }
}

const removeUser = (userId, groupDoc) => {
  if (groupDoc.admins.includes(userId)) {
    _.warn({ userId, groupDoc }, "removing a user from a group she's admin of")
  }

  for (const list of Group.attributes.usersLists) {
    groupDoc[list] = _.without(groupDoc[list], userId)
  }

  return groupDoc
}
