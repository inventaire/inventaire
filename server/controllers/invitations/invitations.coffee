__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
parseEmails = require './lib/parse_emails'
user_ = __.require 'lib', 'user/user'
sendInvitation = require './lib/send_invitations'


module.exports.post = (req, res, next)->
  { body, user } = req
  { action } = body
  switch action
    when 'by-emails' then return invitationByEmails user, body, res
    else error_.bundle res, 'unknown action', 400, action


invitationByEmails = (user, body, res)->
  { message } = body
  emailsString = body.emails
  promises_.start
  .then parseEmails.bind(null, emailsString, user.email)
  .then applyLimit
  .then sendInvitationAndReturnData.bind(null, user, message)
  .then _.Log('invitationByEmails data')
  .then res.json.bind(res)
  .catch error_.Handler(res)

sendInvitationAndReturnData = (user, message, emails)->
  _.types arguments, ['object', 'string|undefined', 'array']
  user_.publicUsersDataByEmails emails
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