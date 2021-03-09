const _ = require('builders/utils')
const groups_ = require('./groups')

module.exports = {
  pendingGroupInvitationsCount: userId => {
    return groups_.byInvitedUser(userId)
    .then(({ length }) => length)
  },

  pendingGroupRequestsCount: userId => {
    return groups_.byAdmin(userId)
    .then(groups => _.sum(groups.map(_.property('requested.length'))))
  }
}
