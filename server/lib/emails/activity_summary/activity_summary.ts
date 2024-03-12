import { findOneWaitingForSummary } from '#controllers/user/lib/summary'
import { oneHour } from '#lib/time'
import { info, logError } from '#lib/utils/logs'
import CONFIG from '#server/config'
import sendActivitySummary from './send_activity_summary.js'

const { maxEmailsPerHour } = CONFIG.activitySummary
const emailsInterval = oneHour / maxEmailsPerHour

export default function () {
  info(CONFIG.activitySummary, 'activity summary')
  setInterval(sendOneUserSummary, emailsInterval)
}

const sendOneUserSummary = async () => {
  try {
    const user = await findOneWaitingForSummary()
    await sendActivitySummary(user)
  } catch (err) {
    logError(err, 'waitingForSummary err')
  }
}
