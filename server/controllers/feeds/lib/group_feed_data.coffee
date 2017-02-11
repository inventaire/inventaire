CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
groups_ = __.require 'controllers', 'groups/lib/groups'
promises_ = __.require 'lib', 'promises'

module.exports = (groupId, authentifiedUserPromise)->
  promises_.all [
    groups_.byId groupId
    authentifiedUserPromise
  ]
  .spread (group, authentifiedUser)->
    membersIds = getGroupMembersIds group
    requestedId = authentifiedUser?._id
    user_.byIds membersIds
    .then (users)->
      users: users
      # Give access to semi-private items only if the requester
      # is a group member
      semiPrivateAccessRight: requestedId in membersIds
      feedOptions:
        title: group.name
        description: group.description
        image: group.picture
        queryString: "group=#{group._id}"
        pathname: "groups/#{group._id}"

getGroupMembersIds = (group)->
  { admins, members } = group
  return admins.concat(members).map _.property('user')
