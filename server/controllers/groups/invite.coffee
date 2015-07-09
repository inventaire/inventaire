CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
groups_ = require './lib/groups'
user_ = __.require 'lib', 'user/user'
tests = __.require 'models','tests/common-tests'

# invitation arent done in bulk in order to keep verifyRightsToInvite simple
module.exports = (req, res)->
  { group, user } = req.body
  invitorId = req.user._id

  unless tests.valid 'userId', user
    return error_.bundle res, "invalid userId", 400, user

  unless tests.valid 'groupId', group
    return error_.bundle res, "invalid groupId", 400, group

  verifyRightsToInvite group, invitorId, user
  .then groups_.invite.bind(groups_, group, invitorId, user)
  .then _.Ok(res)
  .catch error_.Handler(res)

verifyRightsToInvite = (groupId, invitorId, invitedId)->
  promises_.all [
    user_.areFriends(invitorId, invitedId)
    groups_.userInGroup(invitorId, groupId)
  ]
  .spread controlRights.bind(null, arguments)

controlRights = (context, usersAreFriends, invitorInGroup)->
  unless usersAreFriends
    throw error_.new "users aren't friends", 403, context
  unless invitorInGroup
    throw error_.new "invitor isn't in group", 403, context
