import _ from '#builders/utils'
import groups_ from './groups.js'

export default {
  pendingGroupInvitationsCount: userId => {
    return groups_.byInvitedUser(userId)
    .then(({ length }) => length)
  },

  pendingGroupRequestsCount: userId => {
    return groups_.byAdmin(userId)
    .then(groups => _.sum(groups.map(_.property('requested.length'))))
  }
}
