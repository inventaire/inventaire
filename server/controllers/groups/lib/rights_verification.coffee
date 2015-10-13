CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './groups'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
{ possibleActions } = require './actions_lists'


verifyJoinRequestHandlingRights = (userId, groupId, requesterId)->
  promises_.all([
      groups_.userInAdmins(userId, groupId)
      groups_.userInRequested(requesterId, groupId)
    ])
  .spread (userInAdmins, requesterInRequested)->
    unless userInAdmins
      throw error_.new "user isnt admin", 403, userId, groupId
    unless requesterInRequested
      throw error_.new "request not found", 401, requesterId, groupId

verifyUserInGroup = (userId, groupId)->
  groups_.userInGroup userId, groupId
  .then (userInGroup)->
    unless userInGroup
      throw error_.new 'user isnt in the group', 403, userId, groupId

verifyRightsToInvite = (invitorId, groupId, invitedId)->
  promises_.all [
    user_.areFriends(invitorId, invitedId)
    groups_.userInGroup(invitorId, groupId)
  ]
  .spread controlInvitationRights.bind(null, arguments)

controlInvitationRights = (context, usersAreFriends, invitorInGroup)->
  unless usersAreFriends
    throw error_.new "users aren't friends", 403, context
  unless invitorInGroup
    throw error_.new "invitor isn't in group", 403, context

verifyAdminRights = (userId, groupId)->
  groups_.userInAdmins userId, groupId
  .then (bool)->
    unless bool
      throw error_.new 'user isnt a group admin', 403, userId, groupId

verifyAdminRightsWithoutAdminsConflict = (userId, groupId, targetId)->
  promises_.all [
    groups_.userInAdmins(userId, groupId)
    groups_.userInAdmins(targetId, groupId)
  ]
  .spread (userIsAdmin, targetIsAdmin)->
    unless userIsAdmin
      throw error_.new 'user isnt a group admin', 403, userId, groupId
    if targetIsAdmin
      throw error_.new 'target user is also a group admin', 403, userId, groupId, targetId

module.exports = verificators =
  invite: verifyRightsToInvite
  # /!\ groups_.userInvited returns a group doc, not a boolean
  accept: groups_.userInvited
  decline: groups_.userInvited
  request: (userId, groupId)->
    groups_.userInGroupOrOut userId, groupId
    .then (bool)->
      if bool
        throw error_.new "user is already in group", 403, userId, groupId

  cancelRequest: (userId, groupId)->
    groups_.userInRequested userId, groupId
    .then (bool)->
      unless bool
        throw error_.new "request not found", 403, userId, groupId

  acceptRequest: verifyJoinRequestHandlingRights
  refuseRequest: verifyJoinRequestHandlingRights
  updateSettings: verifyAdminRights
  makeAdmin: verifyAdminRights
  kick: verifyAdminRightsWithoutAdminsConflict
  leave: verifyUserInGroup

# just checking that everything looks right
verificatorsList = Object.keys verificators
diff = _.difference possibleActions, verificatorsList
if diff.length > 0
  _.error diff, "groups actions and verificators don't match"
