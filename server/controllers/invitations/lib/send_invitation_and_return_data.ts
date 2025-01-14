import { difference, map } from 'lodash-es'
import { groupAction } from '#controllers/groups/lib/group_action'
import { requestFriend } from '#controllers/relations/lib/intent'
import { getUsersAuthorizedDataByEmails } from '#controllers/user/lib/user'
import type { Group } from '#types/group'
import type { Email, User, UserId } from '#types/user'
import { sendInvitation } from './send_invitations.js'

interface SendInvitationAndReturnDataParams {
  reqUser: User
  message?: string
  group?: Group
  parsedEmails: Email[]
  reqUserId: UserId
}

export async function sendInvitationAndReturnData ({ reqUser, message, group, parsedEmails, reqUserId }: SendInvitationAndReturnDataParams) {
  const existingUsers = await getUsersAuthorizedDataByEmails(parsedEmails, reqUserId)
  const existingUsersEmails = map(existingUsers, 'email')
  const remainingEmails = difference(parsedEmails, existingUsersEmails)

  await Promise.all([
    sendInvitation({ reqUser, group, emails: remainingEmails, message }),
    ...existingUsers.map(invitedUser => inviteExistingUser({ reqUser, invitedUser, group })),
  ])

  return {
    users: existingUsers,
    emails: remainingEmails,
  }
}

async function inviteExistingUser ({ reqUser, invitedUser, group }) {
  if (group) {
    try {
      return await groupAction('invite', { reqUserId: reqUser._id, group: group._id, user: invitedUser._id })
    } catch (err) {
      if (err.message !== 'membership already exist') throw err
    }
  } else {
    return await requestFriend(reqUser._id, invitedUser._id)
  }
}
