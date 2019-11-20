const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

// Working around the circular dependency
let groups_
const lateRequire = () => { groups_ = require('./groups') }
setTimeout(lateRequire, 0)

module.exports = {
  pendingGroupInvitationsCount: userId => {
    return groups_.byInvitedUser(userId)
    .get('length')
  },

  pendingGroupRequestsCount: userId => {
    return groups_.byAdmin(userId)
    .then(groups => _.sum(groups.map(_.property('requested.length'))))
  }
}
