__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
invitations_ = require './invitations'
Invited = __.require 'models', 'invited'
radio = __.require 'lib', 'radio'

module.exports = (user, group, emails, message)->
  _.types arguments, ['object', 'object|null', 'array', 'string|null']
  userId = user._id
  groupId = group?._id
  _.log emails, 'send_invitations emails'

  invitations_.byEmails emails
  .then _.Log('known invited')
  .then (existingInvitedUsers)->

    # Emails already invited by others but not this user
    canBeInvited = extractCanBeInvited userId, groupId, existingInvitedUsers
    _.log canBeInvited, 'known emails that canBeInvited by the current user'

    # Find emails that were never invited by anyone
    unknownEmails = extractUnknownEmails emails, existingInvitedUsers
    _.log unknownEmails, 'unknown emails'

    promises_.all [
      # Create an invitation doc for unknown emails
      invitations_.createUnknownInvited userId, groupId, unknownEmails
      # Add the invitation to the existing doc for known emails
      invitations_.addInviter userId, groupId, canBeInvited
    ]
    .then ->
      remainingEmails = concatRemainingEmails canBeInvited, unknownEmails
      _.log remainingEmails, 'effectively sent emails'

      triggerInvitation user, group, remainingEmails, message

  .catch _.Error('send invitations err')

triggerInvitation = (user, group, emails, message)->
  if group?
    radio.emit 'send:group:email:invitations', user, group, emails, message
  else
    radio.emit 'send:email:invitations', user, emails, message

extractUnknownEmails = (emails, knownInvitedUsers)->
  knownInvitedUsersEmails = _.map knownInvitedUsers, 'email'
  return _.difference emails, knownInvitedUsersEmails

extractCanBeInvited = (userId, groupId, knownInvitedUsers)->
  return knownInvitedUsers.filter Invited.canBeInvited(userId, groupId)

concatRemainingEmails = (canBeInvited, unknownEmails)->
  knownEmails = _.map canBeInvited, 'email'
  return unknownEmails.concat knownEmails
