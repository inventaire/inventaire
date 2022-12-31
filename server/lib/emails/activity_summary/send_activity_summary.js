import _ from 'builders/utils'
import { justReceivedActivitySummary } from 'controllers/user/lib/summary'
import transporter_ from '../transporter'
import buildEmail from './build_email'
import CONFIG from 'config'

const { disableUserUpdate } = CONFIG.activitySummary

let updateUser
// It can be convenient in development to disable user update
// to keep generate the same email from a given test user
if (disableUserUpdate) {
  updateUser = userId => _.warn(userId, 'disabledUserUpdate')
} else {
  updateUser = justReceivedActivitySummary
}

export default async user => {
  if (user == null) return _.info('no user waiting for summary')

  const userId = user._id

  const email = await buildEmail(user)

  // Update the user even if no activity summary needs to be sent
  // to prevent re-attempting to send a summary to that same user
  if (!email) return updateUser(userId)

  return transporter_.sendMail(email)
  .then(() => updateUser(userId))
  .catch(_.Error('activity summary'))
}
