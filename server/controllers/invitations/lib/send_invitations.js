import _ from '#builders/utils'
import { emit } from '#lib/radio'
import { assert_ } from '#lib/utils/assert_types'
import { log, LogError, Log } from '#lib/utils/logs'
import Invited from '#models/invited'
import invitations_ from './invitations.js'

export default (user, group, emails, message) => {
  assert_.object(user)
  assert_.type('object|null', group)
  assert_.array(emails)
  assert_.type('string|null', message)
  const userId = user._id
  const groupId = group && group._id
  log(emails, 'send_invitations emails')

  return invitations_.byEmails(emails)
  .then(Log('known invited'))
  .then(existingInvitedUsers => {
    // Emails already invited by others but not this user
    const canBeInvited = extractCanBeInvited(userId, groupId, existingInvitedUsers)
    log(canBeInvited, 'known emails that canBeInvited by the current user')

    // Find emails that were never invited by anyone
    const unknownEmails = extractUnknownEmails(emails, existingInvitedUsers)
    log(unknownEmails, 'unknown emails')

    return Promise.all([
      // Create an invitation doc for unknown emails
      invitations_.createUnknownInvited(userId, groupId, unknownEmails),
      // Add the invitation to the existing doc for known emails
      invitations_.addInviter(userId, groupId, canBeInvited),
    ])
    .then(() => {
      const remainingEmails = concatRemainingEmails(canBeInvited, unknownEmails)
      log(remainingEmails, 'effectively sent emails')

      return triggerInvitation(user, group, remainingEmails, message)
    })
  })
  .catch(LogError('send invitations err'))
}

const triggerInvitation = async (user, group, emails, message) => {
  if (group) {
    await emit('send:group:email:invitations', user, group, emails, message)
  } else {
    await emit('send:email:invitations', user, emails, message)
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
