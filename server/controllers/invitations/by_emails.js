

// Fix any style issues and re-enable lint.
// Send an email to invite someone to connect to the requester as friends
// If a group id is passed, invite to join the group instead (group admins only)

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')
const responses_ = __.require('lib', 'responses')
const parseEmails = require('./lib/parse_emails')
const sendInvitationAndReturnData = require('./lib/send_invitation_and_return_data')
const groups_ = __.require('controllers', 'groups/lib/groups')
const Group = __.require('models', 'group')
const { Track } = __.require('lib', 'track')

module.exports = (req, res) => {
  const { user, body } = req
  let { emails, message, group: groupId } = body
  const { _id: reqUserId } = req.user

  if (message != null) {
    if (_.isString(message)) {
      if (message.length === 0) { message = null }
    } else {
      return error_.bundleInvalid(req, res, 'message', message)
    }
  } else {
    // Convert undefined message to null to make following type checks easier
    message = null
  }

  return promises_.all([
    parseAndValidateEmails(emails, user.email),
    validateGroup(groupId, reqUserId)
  ])
  .spread((parsedEmails, group) => sendInvitationAndReturnData({ user, message, group, parsedEmails, reqUserId })
  .then(_.Log('invitationByEmails data'))
  .then(responses_.Send(res))
  .then(Track(req, [ 'invitation', 'email', null, parsedEmails.length ]))).catch(error_.Handler(req, res))
}

const parseAndValidateEmails = (emails, userEmail) => promises_.try(() => {
  const parsedEmails = parseEmails(emails)
  // Removing the requesting user email if for some reason
  // it ended up in the list
  const filteredEmails = _.without(parsedEmails, userEmail.toLowerCase())
  return applyLimit(filteredEmails)
})

const validateGroup = (groupId, reqUserId) => {
  if (groupId == null) return promises_.resolve(null)

  if (!_.isGroupId(groupId)) {
    return error_.rejectInvalid('group id', groupId)
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

// this is totally arbitrary but sending too many invites at a time
// will probably end up being reported as spam
const limit = 50
const applyLimit = emails => {
  if (emails.length > limit) {
    throw error_.new(`you can't send more than ${limit} invitations at a time`, 400)
  } else {
    return emails
  }
}
