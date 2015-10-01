CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './groups'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'


handleRequest = (userId, groupId, requesterId)->
  promises_.all([
      groups_.userInAdmins(userId, groupId)
      groups_.userInRequested(requesterId, groupId)
    ])
  .spread (userInAdmins, requesterInRequested)->
    unless userInAdmins
      throw error_.new "user isnt admin", 403, userId, groupId
    unless requesterInRequested
      throw error_.new "request not found", 401, requesterId, groupId

verifyRightsToInvite = (invitorId, groupId, invitedId)->
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

verifyAdminRights = (userId, groupId)->
  groups_.userInAdmins userId, groupId
  .then (bool)->
    unless bool
      throw error_.new 'user isnt a group admin', 403, userId, groupId

module.exports =
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

  acceptRequest: handleRequest
  refuseRequest: handleRequest
  updateSettings: verifyAdminRights
