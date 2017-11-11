# Send an email to invite someone to connect to the requester as friends
# If a group id is passed, invite to join the group instead (group admins only)

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
parseEmails = require './lib/parse_emails'
sendInvitationAndReturnData = require './lib/send_invitation_and_return_data'
groups_ = __.require 'controllers', 'groups/lib/groups'
Group = __.require 'models', 'group'
slugify = __.require 'controllers', 'groups/lib/slugify'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res)->
  { user, body } = req
  { emails, message, group:groupId } = body
  { _id:reqUserId } = req.user

  if message?
    if _.isString message
      if message.length is 0 then message = null
    else
      return error_.bundleInvalid req, res, 'message', message
  else
    # Convert undefined message to null to make following type checks easier
    message = null

  promises_.all [
    parseAndValidateEmails emails, user.email
    validateGroup groupId, reqUserId
  ]
  .spread (parsedEmails, group)->
    sendInvitationAndReturnData { user, message, group, parsedEmails, reqUserId }
    .then _.Log('invitationByEmails data')
    .then res.json.bind(res)
    .then Track(req, ['invitation', 'email', null, parsedEmails.length])
  .catch error_.Handler(req, res)

parseAndValidateEmails = (emails, userEmail)->
  promises_.try ->
    parsedEmails = parseEmails emails, userEmail
    return applyLimit parsedEmails

validateGroup = (groupId, reqUserId)->
  unless groupId? then return promises_.resolve null

  if _.isGroupId groupId then getFnName = 'byId'
  else if mayBeASlug groupId then getFnName = 'bySlug'
  else return error_.reject 'invalid group id or slug', 400, groupId

  groups_[getFnName](groupId)
  .then (group)->
    userIsAdmin = Group.userIsAdmin reqUserId, group
    unless userIsAdmin
      throw error_.new "user isn't group admin", 403, { groupId, reqUserId }
    return group
  .catch (err)->
    if err.statusCode is 404
      throw error_.new 'group not found', 404, { groupId, reqUserId }
    else
      throw err

mayBeASlug = (str)-> str is slugify(str)

# this is totally arbitrary but sending too many invites at a time
# will probably end up being reported as spam
limit = 50
applyLimit = (emails)->
  if emails.length > limit
    throw error_.new "you can't send more than #{limit} invitations at a time", 400
  else
    return emails
