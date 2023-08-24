import { difference, map } from 'lodash-es'
import { addInviter, createUnknownInvited, getInvitationsByEmails } from '#controllers/invitations/lib/invitations'
import { emit } from '#lib/radio'
import { assert_ } from '#lib/utils/assert_types'
import { log } from '#lib/utils/logs'
import Invited from '#models/invited'

export async function sendInvitation ({ reqUser, group, emails, message }) {
  assert_.object(reqUser)
  assert_.type('object|null', group)
  assert_.array(emails)
  assert_.type('string|null', message)
  const reqUserId = reqUser._id
  const groupId = group && group._id
  log(emails, 'send_invitations emails')

  const existingInvitedUsers = await getInvitationsByEmails(emails)
  log(existingInvitedUsers, 'known invited')
  // Emails already invited by others but not this user
  const canBeInvited = extractCanBeInvited(reqUserId, groupId, existingInvitedUsers)
  log(canBeInvited, 'known emails that canBeInvited by the current user')

  // Find emails that were never invited by anyone
  const unknownEmails = extractUnknownEmails(emails, existingInvitedUsers)
  log(unknownEmails, 'unknown emails')

  await Promise.all([
    // Create an invitation doc for unknown emails
    createUnknownInvited(reqUserId, groupId, unknownEmails),
    // Add the invitation to the existing doc for known emails
    addInviter(reqUserId, groupId, canBeInvited),
  ])
  const remainingEmails = concatRemainingEmails(canBeInvited, unknownEmails)
  log(remainingEmails, 'effectively sent emails')

  if (group) {
    await emit('send:group:email:invitations', reqUser, group, emails, message)
  } else {
    await emit('send:email:invitations', reqUser, emails, message)
  }
}

function extractUnknownEmails (emails, knownInvitedUsers) {
  const knownInvitedUsersEmails = map(knownInvitedUsers, 'email')
  return difference(emails, knownInvitedUsersEmails)
}

function extractCanBeInvited (reqUserId, groupId, knownInvitedUsers) {
  return knownInvitedUsers.filter(Invited.canBeInvited(reqUserId, groupId))
}

function concatRemainingEmails (canBeInvited, unknownEmails) {
  const knownEmails = map(canBeInvited, 'email')
  return unknownEmails.concat(knownEmails)
}
