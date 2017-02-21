CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './groups'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
{ possibleActions } = require './actions_lists'

verifyJoinRequestHandlingRights = (reqUserId, groupId, requesterId)->
  promises_.all([
      groups_.userInAdmins(reqUserId, groupId)
      groups_.userInRequested(requesterId, groupId)
    ])
  .spread (userInAdmins, requesterInRequested)->
    unless userInAdmins
      throw error_.new "user isnt admin", 403, reqUserId, groupId
    unless requesterInRequested
      throw error_.new "request not found", 401, requesterId, groupId

verifyRightsToInvite = (reqUserId, groupId, invitedUserId)->
  promises_.all [
    user_.areFriends(reqUserId, invitedUserId)
    groups_.userInGroup(reqUserId, groupId)
  ]
  .spread controlInvitationRights.bind(null, arguments)

controlInvitationRights = (context, usersAreFriends, invitorInGroup)->
  unless usersAreFriends
    throw error_.new "users aren't friends", 403, context
  unless invitorInGroup
    throw error_.new "invitor isn't in group", 403, context

verifyAdminRights = (reqUserId, groupId)->
  groups_.userInAdmins reqUserId, groupId
  .then (bool)->
    unless bool
      throw error_.new 'user isnt a group admin', 403, reqUserId, groupId

verifyAdminRightsWithoutAdminsConflict = (reqUserId, groupId, targetId)->
  promises_.all [
    groups_.userInAdmins(reqUserId, groupId)
    groups_.userInAdmins(targetId, groupId)
  ]
  .spread (userIsAdmin, targetIsAdmin)->
    unless userIsAdmin
      throw error_.new 'user isnt a group admin', 403, reqUserId, groupId
    if targetIsAdmin
      throw error_.new 'target user is also a group admin', 403, reqUserId, groupId, targetId

verifyUserRightToLeave = (reqUserId, groupId)->
  promises_.all [
    groups_.userInGroup(reqUserId, groupId)
    groups_.userCanLeave(reqUserId, groupId)
  ]
  .spread (userInGroup, userCanLeave)->
    unless userInGroup
      throw error_.new 'user isnt in the group', 403, reqUserId, groupId
    unless userCanLeave
      message = "the last group admin can't leave before naming another admin"
      throw error_.new message, 403, reqUserId, groupId

module.exports = verificators =
  invite: verifyRightsToInvite
  # /!\ groups_.userInvited returns a group doc, not a boolean
  accept: groups_.userInvited
  decline: groups_.userInvited
  request: (reqUserId, groupId)->
    groups_.userInGroupOrOut reqUserId, groupId
    .then (bool)->
      if bool
        throw error_.new "user is already in group", 403, reqUserId, groupId

  cancelRequest: (reqUserId, groupId)->
    groups_.userInRequested reqUserId, groupId
    .then (bool)->
      unless bool
        throw error_.new "request not found", 403, reqUserId, groupId

  acceptRequest: verifyJoinRequestHandlingRights
  refuseRequest: verifyJoinRequestHandlingRights
  updateSettings: verifyAdminRights
  makeAdmin: verifyAdminRights
  kick: verifyAdminRightsWithoutAdminsConflict
  leave: verifyUserRightToLeave

# just checking that everything looks right
verificatorsList = Object.keys verificators
diff = _.difference possibleActions, verificatorsList
if diff.length > 0
  _.error diff, "groups actions and verificators don't match"
