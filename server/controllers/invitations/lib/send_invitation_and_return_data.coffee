__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
sendInvitation = require './send_invitations'

module.exports = (params)->
  { user, message, group, parsedEmails, reqUserId } = params
  _.assertType user, 'object'
  _.assertType message, 'string|null'
  _.assertType group, 'object|null'
  _.assertType parsedEmails, 'array'
  _.assertType reqUserId, 'string'

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
