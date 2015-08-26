__ = require('config').root
_ = __.require 'builders', 'utils'
invitations_ = require './invitations'
{ extractUnknownEmails, extractNotAlreadyInvited, extractRemainingEmails, createUnknownInvited } = invitations_
Invited = __.require 'models','invited'
Radio = __.require 'lib', 'radio'


module.exports = (user, emails, message)->
  userId = user._id
  _.log emails, 'send_invitations emails'
  _.types arguments, ['object', 'array', 'string|undefined']

  invitations_.byEmails emails
  .then _.Log('known invited')
  .then (existingInvitedUsers)->

    unknownEmails = extractUnknownEmails emails, existingInvitedUsers
    _.log unknownEmails, 'unknown emails'
    createUnknownInvited userId, unknownEmails

    # emails already invited by others but not this user
    notAlreadyInvited = extractNotAlreadyInvited userId, existingInvitedUsers
    _.log notAlreadyInvited, 'known emails notAlreadyInvited by the current user'
    invitations_.addInviter userId, notAlreadyInvited

    remainingEmails = extractRemainingEmails notAlreadyInvited, unknownEmails
    _.log remainingEmails, 'remainingEmails'
    sendInvitationEmails user, remainingEmails, message

  .catch _.Error('send invitations err')


sendInvitationEmails = (user, emails, message)->
  Radio.emit 'send:email:invitations', user, emails, message
