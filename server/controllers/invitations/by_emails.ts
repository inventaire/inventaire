// Send an email to invite someone to connect to the requester as friends
// If a group id is passed, invite to join the group instead (group admins only)
import { without } from 'lodash-es'
import { getGroupById } from '#controllers/groups/lib/groups'
import { isGroupId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { newInvalidError } from '#lib/error/pre_filled'
import { userIsGroupMember } from '#models/group'
import parseEmails from './lib/parse_emails.js'
import { sendInvitationAndReturnData } from './lib/send_invitation_and_return_data.js'

const sanitization = {
  emails: {},
  message: { optional: true },
  group: { optional: true },
}

export async function controller (params, req) {
  const { emails, groupId, reqUserId } = params
  let { message } = params
  const { user } = req

  // Convert undefined or empty string message to null to make following type checks easier
  if (!message) message = null

  const [ parsedEmails, group ] = await Promise.all([
    parseAndValidateEmails(emails, user.email),
    validateGroup(groupId, reqUserId),
  ])

  const invitationByEmailsData = await sendInvitationAndReturnData({
    reqUser: user,
    message,
    group,
    parsedEmails,
    reqUserId,
  })
  return invitationByEmailsData
}

async function parseAndValidateEmails (emails, userEmail) {
  const parsedEmails = parseEmails(emails)
  // Removing the requesting user email if for some reason
  // it ended up in the list
  const filteredEmails = without(parsedEmails, userEmail.toLowerCase())
  return applyLimit(filteredEmails)
}

async function validateGroup (groupId, reqUserId) {
  if (groupId == null) return null

  if (!isGroupId(groupId)) {
    throw newInvalidError('group id', groupId)
  }

  return getGroupById(groupId)
  .then(group => {
    const userIsMember = userIsGroupMember(reqUserId, group)
    if (!userIsMember) {
      throw newError("user isn't a group member", 403, { groupId, reqUserId })
    }
    return group
  })
  .catch(err => {
    if (err.statusCode === 404) {
      throw newError('group not found', 404, { groupId, reqUserId })
    } else {
      throw err
    }
  })
}

// This is totally arbitrary but sending too many invites at a time
// will probably end up being reported as spam
const limit = 50
function applyLimit (emails) {
  if (emails.length > limit) {
    throw newError(`you can't send more than ${limit} invitations at a time`, 400)
  } else {
    return emails
  }
}

export default { sanitization, controller, track: [ 'invitation', 'email' ] }
