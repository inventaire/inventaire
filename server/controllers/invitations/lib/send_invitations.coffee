__ = require('config').universalPath
_ = __.require 'builders', 'utils'
invitations_ = require './invitations'
{ extractUnknownEmails, extractCanBeInvited, extractRemainingEmails, createUnknownInvited } = invitations_
Invited = __.require 'models','invited'
radio = __.require 'lib', 'radio'

module.exports = (user, emails, message)->
  userId = user._id
  _.log emails, 'send_invitations emails'
  _.types arguments, ['object', 'array', 'string|null']

  invitations_.byEmails emails
  .then _.Log('known invited')
  .then (existingInvitedUsers)->

    unknownEmails = extractUnknownEmails emails, existingInvitedUsers
    _.log unknownEmails, 'unknown emails'
    createUnknownInvited userId, unknownEmails

    # emails already invited by others but not this user
    canBeInvited = extractCanBeInvited userId, existingInvitedUsers
    _.log canBeInvited, 'known emails that canBeInvited by the current user'
    invitations_.addInviter userId, canBeInvited

    remainingEmails = extractRemainingEmails canBeInvited, unknownEmails
    _.log remainingEmails, 'effectively sent emails'
    radio.emit 'send:email:invitations', user, remainingEmails, message

  .catch _.Error('send invitations err')
