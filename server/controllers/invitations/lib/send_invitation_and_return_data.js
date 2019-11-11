__ = require('config').universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
user_ = __.require 'controllers', 'user/lib/user'
sendInvitation = require './send_invitations'

module.exports = (params)->
  { user, message, group, parsedEmails, reqUserId } = params
  assert_.object user
  assert_.type 'string|null', message
  assert_.type 'object|null', group
  assert_.array parsedEmails
  assert_.string reqUserId

  user_.getUsersByEmails parsedEmails, reqUserId
  .then (existingUsers)->
    existingUsersEmails = _.map existingUsers, 'email'
    remainingEmails = _.difference parsedEmails, existingUsersEmails

    sendInvitation user, group, remainingEmails, message
    .then ->
      # letting the client do the friends requests
      # to the existing users so that it updates itself
      return data =
        users: existingUsers
        emails: remainingEmails
