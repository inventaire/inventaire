const __ = require('config').universalPath
const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const user_ = require('controllers/user/lib/user')
const sendInvitation = require('./send_invitations')

module.exports = params => {
  const { user, message, group, parsedEmails, reqUserId } = params
  assert_.object(user)
  assert_.type('string|null', message)
  assert_.type('object|null', group)
  assert_.array(parsedEmails)
  assert_.string(reqUserId)

  return user_.getUsersByEmails(parsedEmails, reqUserId)
  .then(existingUsers => {
    const existingUsersEmails = _.map(existingUsers, 'email')
    const remainingEmails = _.difference(parsedEmails, existingUsersEmails)

    return sendInvitation(user, group, remainingEmails, message)
    .then(() => {
      // letting the client do the friends requests
      // to the existing users so that it updates itself
      return {
        users: existingUsers,
        emails: remainingEmails
      }
    })
  })
}
