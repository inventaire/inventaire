// Send an email to invite someone to connect to the requester as friends
// If a group id is passed, invite to join the group instead (group admins only)
const __ = require('config').universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const parseEmails = require('./lib/parse_emails')
const sendInvitationAndReturnData = require('./lib/send_invitation_and_return_data')
const groups_ = require('controllers/groups/lib/groups')
const Group = require('models/group')
const { Track } = require('lib/track')

module.exports = (req, res) => {
  const { user, body } = req
  let { emails, message, group: groupId } = body
  const { _id: reqUserId } = req.user

  if (message) {
    if (!_.isString(message)) {
      return error_.bundleInvalid(req, res, 'message', message)
    }
  } else {
    // Convert undefined or empty string message to null to make following type checks easier
    message = null
  }

  Promise.all([
    parseAndValidateEmails(emails, user.email),
    validateGroup(groupId, reqUserId)
  ])
  .then(([ parsedEmails, group ]) => {
    return sendInvitationAndReturnData({ user, message, group, parsedEmails, reqUserId })
    .then(_.Log('invitationByEmails data'))
    .then(responses_.Send(res))
    .then(Track(req, [ 'invitation', 'email', null, parsedEmails.length ]))
  })
  .catch(error_.Handler(req, res))
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
