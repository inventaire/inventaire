
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const promises_ = __.require('lib', 'promises')
const invitations_ = require('./invitations')
const Invited = __.require('models', 'invited')
const radio = __.require('lib', 'radio')

module.exports = (user, group, emails, message) => {
  assert_.type(user, 'object')
  assert_.type(group, 'object|null')
  assert_.type(emails, 'array')
  assert_.type(message, 'string|null')
  const userId = user._id
  const groupId = group != null ? group._id : undefined
  _.log(emails, 'send_invitations emails')

  return invitations_.byEmails(emails)
  .then(_.Log('known invited'))
  .then(existingInvitedUsers => {
    // Emails already invited by others but not this user
    const canBeInvited = extractCanBeInvited(userId, groupId, existingInvitedUsers)
    _.log(canBeInvited, 'known emails that canBeInvited by the current user')

    // Find emails that were never invited by anyone
    const unknownEmails = extractUnknownEmails(emails, existingInvitedUsers)
    _.log(unknownEmails, 'unknown emails')

    return promises_.all([
      // Create an invitation doc for unknown emails
      invitations_.createUnknownInvited(userId, groupId, unknownEmails),
      // Add the invitation to the existing doc for known emails
      invitations_.addInviter(userId, groupId, canBeInvited)
    ])
    .then(() => {
      const remainingEmails = concatRemainingEmails(canBeInvited, unknownEmails)
      _.log(remainingEmails, 'effectively sent emails')

      return triggerInvitation(user, group, remainingEmails, message)
    })
  })
  .catch(_.Error('send invitations err'))
}

const triggerInvitation = (user, group, emails, message) => {
  if (group != null) {
    return radio.emit('send:group:email:invitations', user, group, emails, message)
  } else {
    return radio.emit('send:email:invitations', user, emails, message)
  }
}

const extractUnknownEmails = (emails, knownInvitedUsers) => {
  const knownInvitedUsersEmails = _.map(knownInvitedUsers, 'email')
  return _.difference(emails, knownInvitedUsersEmails)
}

const extractCanBeInvited = (userId, groupId, knownInvitedUsers) => knownInvitedUsers.filter(Invited.canBeInvited(userId, groupId))

const concatRemainingEmails = (canBeInvited, unknownEmails) => {
  const knownEmails = _.map(canBeInvited, 'email')
  return unknownEmails.concat(knownEmails)
}
