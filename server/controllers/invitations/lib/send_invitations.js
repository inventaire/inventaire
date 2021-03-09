const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const invitations_ = require('./invitations')
const Invited = require('models/invited')
const radio = require('lib/radio')

module.exports = (user, group, emails, message) => {
  assert_.object(user)
  assert_.type('object|null', group)
  assert_.array(emails)
  assert_.type('string|null', message)
  const userId = user._id
  const groupId = group && group._id
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

    return Promise.all([
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
  if (group) {
    radio.emit('send:group:email:invitations', user, group, emails, message)
  } else {
    radio.emit('send:email:invitations', user, emails, message)
  }
}

const extractUnknownEmails = (emails, knownInvitedUsers) => {
  const knownInvitedUsersEmails = _.map(knownInvitedUsers, 'email')
  return _.difference(emails, knownInvitedUsersEmails)
}

const extractCanBeInvited = (userId, groupId, knownInvitedUsers) => {
  return knownInvitedUsers.filter(Invited.canBeInvited(userId, groupId))
}

const concatRemainingEmails = (canBeInvited, unknownEmails) => {
  const knownEmails = _.map(canBeInvited, 'email')
  return unknownEmails.concat(knownEmails)
}
