import { justReceivedActivitySummary } from '#controllers/user/lib/summary'
import { sendMail } from '#lib/emails/transporter'
import { warn, info, logError } from '#lib/utils/logs'
import config from '#server/config'
import buildEmail from './build_email.js'

const { disableUserUpdate } = config.activitySummary

let updateUser
// It can be convenient in development to disable user update
// to keep generate the same email from a given test user
if (disableUserUpdate) {
  updateUser = userId => warn(userId, 'disabledUserUpdate')
} else {
  updateUser = justReceivedActivitySummary
}

export default async user => {
  if (user == null) return info('no user waiting for summary')

  const userId = user._id

  const email = await buildEmail(user)

  // Update the user even if no activity summary needs to be sent
  // to prevent re-attempting to send a summary to that same user
  if (!email) return updateUser(userId)

  try {
    await sendMail(email)
    await updateUser(userId)
  } catch (err) {
    logError(err, 'activity summary')
  }
}
