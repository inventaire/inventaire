import { findOneWaitingForSummary } from '#controllers/user/lib/summary'
import { oneHour } from '#lib/time'
import { info, logError } from '#lib/utils/logs'
import config from '#server/config'
import sendActivitySummary from './send_activity_summary.js'

const { maxEmailsPerHour } = config.activitySummary
const emailsInterval = oneHour / maxEmailsPerHour

export default function () {
  info(config.activitySummary, 'activity summary')
  setInterval(sendOneUserSummary, emailsInterval)
}

async function sendOneUserSummary () {
  try {
    const user = await findOneWaitingForSummary()
    await sendActivitySummary(user)
  } catch (err) {
    logError(err, 'waitingForSummary err')
  }
}
