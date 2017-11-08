__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
parseEmails = require './lib/parse_emails'
user_ = __.require 'controllers', 'user/lib/user'
sendInvitation = require './lib/send_invitations'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res)->
  { user, body } = req
  { message } = body
  { _id:reqUserId } = req.user
  emailsString = body.emails
  promises_.try parseEmails.bind(null, emailsString, user.email)
  .then applyLimit
  .then (emails)->
    sendInvitationAndReturnData user, message, emails, reqUserId
    .then _.Log('invitationByEmails data')
    .then res.json.bind(res)
    .then Track(req, ['invitation', 'email', null, emails.length])
  .catch error_.Handler(req, res)

sendInvitationAndReturnData = (user, message, emails, reqUserId)->
  _.types arguments, ['object', 'string|undefined', 'array', 'string']
  user_.getUsersByEmails emails, reqUserId
  .then (existingUsers)->
    existingUsersEmails = existingUsers.map _.property('email')
    remainingEmails = _.difference emails, existingUsersEmails
    # not waiting for the invitation to be sent to return the data
    sendInvitation user, remainingEmails, message
    # letting the client do the friends requests
    # to the existing users so that it updates itself
    return data =
      users: existingUsers
      emails: remainingEmails

# this is totally arbitrary but sending too many invites at a time
# will probably end up being reported as spam
limit = 50
applyLimit = (emails)->
  if emails.length > limit
    throw error_.new "you can't send more than #{limit} invitations at a time", 400
  else
    return emails
