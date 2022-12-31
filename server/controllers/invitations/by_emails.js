// Send an email to invite someone to connect to the requester as friends
// If a group id is passed, invite to join the group instead (group admins only)
import _ from 'builders/utils'

import error_ from 'lib/error/error'
import responses_ from 'lib/responses'
import parseEmails from './lib/parse_emails'
import sendInvitationAndReturnData from './lib/send_invitation_and_return_data'
import groups_ from 'controllers/groups/lib/groups'
import Group from 'models/group'
import { Track } from 'lib/track'
import { sanitize, validateSanitization } from 'lib/sanitize/sanitize'

const sanitization = validateSanitization({
  emails: {},
  message: { optional: true },
  group: { optional: true },
})

export default async (req, res) => {
  const params = sanitize(req, res, sanitization)
  const { emails, groupId, reqUserId } = params
  const { user } = req
  let { message } = params

  // Convert undefined or empty string message to null to make following type checks easier
  if (!message) message = null

  const [ parsedEmails, group ] = await Promise.all([
    parseAndValidateEmails(emails, user.email),
    validateGroup(groupId, reqUserId)
  ])

  return sendInvitationAndReturnData({ user, message, group, parsedEmails, reqUserId })
  .then(_.Log('invitationByEmails data'))
  .then(responses_.Send(res))
  .then(Track(req, [ 'invitation', 'email', null, parsedEmails.length ]))
}

const parseAndValidateEmails = async (emails, userEmail) => {
  const parsedEmails = parseEmails(emails)
  // Removing the requesting user email if for some reason
  // it ended up in the list
  const filteredEmails = _.without(parsedEmails, userEmail.toLowerCase())
  return applyLimit(filteredEmails)
}

const validateGroup = async (groupId, reqUserId) => {
  if (groupId == null) return null

  if (!_.isGroupId(groupId)) {
    throw error_.newInvalid('group id', groupId)
  }

  return groups_.byId(groupId)
  .then(group => {
    const userIsMember = Group.userIsMember(reqUserId, group)
    if (!userIsMember) {
      throw error_.new("user isn't a group member", 403, { groupId, reqUserId })
    }
    return group
  })
  .catch(err => {
    if (err.statusCode === 404) {
      throw error_.new('group not found', 404, { groupId, reqUserId })
    } else {
      throw err
    }
  })
}

// This is totally arbitrary but sending too many invites at a time
// will probably end up being reported as spam
const limit = 50
const applyLimit = emails => {
  if (emails.length > limit) {
    throw error_.new(`you can't send more than ${limit} invitations at a time`, 400)
  } else {
    return emails
  }
}
