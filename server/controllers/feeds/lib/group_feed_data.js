// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const groups_ = __.require('controllers', 'groups/lib/groups')
const promises_ = __.require('lib', 'promises')

module.exports = (groupId, authentifiedUserPromise) => promises_.all([
  groups_.byId(groupId),
  authentifiedUserPromise
])
.spread((group, authentifiedUser) => {
  const membersIds = getGroupMembersIds(group)
  const requestedId = authentifiedUser != null ? authentifiedUser._id : undefined
  return user_.byIds(membersIds)
  .then(users => ({
    users,

    // Give access to semi-private ('network') items only if the requester
    // is a group member
    accessLevel: membersIds.includes(requestedId) ? 'network' : 'public',

    feedOptions: {
      title: group.name,
      description: group.description,
      image: group.picture,
      queryString: `group=${group._id}`,
      pathname: `groups/${group._id}`
    }
  }))
})

var getGroupMembersIds = function(group){
  const { admins, members } = group
  return admins.concat(members).map(_.property('user'))
}
