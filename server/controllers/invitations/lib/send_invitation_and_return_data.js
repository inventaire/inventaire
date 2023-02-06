import _ from '#builders/utils'
import { getUsersAuthorizedDataByEmails } from '#controllers/user/lib/user'
import { assert_ } from '#lib/utils/assert_types'
import sendInvitation from './send_invitations.js'

export default async params => {
  const { user, message, group, parsedEmails, reqUserId } = params
  assert_.object(user)
  assert_.type('string|null', message)
  assert_.type('object|null', group)
  assert_.array(parsedEmails)
  assert_.string(reqUserId)

  const existingUsers = await getUsersAuthorizedDataByEmails(parsedEmails, reqUserId)
  const existingUsersEmails = _.map(existingUsers, 'email')
  const remainingEmails = _.difference(parsedEmails, existingUsersEmails)

  await sendInvitation(user, group, remainingEmails, message)
  // letting the client do the friends requests
  // to the existing users so that it updates itself
  return {
    users: existingUsers,
    emails: remainingEmails,
  }
}
