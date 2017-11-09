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
  { emails, message } = body
  { _id:reqUserId } = req.user

  if message?
    if _.isString message
      if message.length is 0 then message = null
    else
      return error_.bundleInvalid req, res, 'message', message
  else
    # Convert undefined message to null to make following type checks easier
    message = null

  promises_.try parseEmails.bind(null, emails, user.email)
  .then applyLimit
  .then (parsedEmails)->
    sendInvitationAndReturnData user, message, parsedEmails, reqUserId
    .then _.Log('invitationByEmails data')
    .then res.json.bind(res)
    .then Track(req, ['invitation', 'email', null, parsedEmails.length])
  .catch error_.Handler(req, res)

sendInvitationAndReturnData = (user, message, emails, reqUserId)->
  _.types arguments, ['object', 'string|null', 'array', 'string']
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
