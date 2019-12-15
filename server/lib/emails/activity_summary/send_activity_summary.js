const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { justReceivedActivitySummary } = __.require('controllers', 'user/lib/summary')
const transporter_ = require('../transporter')
const buildEmail = require('./build_email')
const promises_ = __.require('lib', 'promises')
const { disableUserUpdate } = CONFIG.activitySummary

let updateUser
// It can be convenient in development to disable user update
// to keep generate the same email from a given test user
if (disableUserUpdate) {
  updateUser = userId => _.warn(userId, 'disabledUserUpdate')
} else {
  updateUser = justReceivedActivitySummary
}

module.exports = user => {
  if (user == null) return _.info('no user waiting for summary')

  const userId = user._id

  return buildEmail(user)
  .then(transporter_.sendMail)
  // catch skiped updates before updating the user
  // as otherwise the user would still appear as needing an activity summary
  .catch(promises_.catchSkip('activity summary'))
  .then(() => updateUser(userId))
  .catch(_.Error('activity summary'))
}
