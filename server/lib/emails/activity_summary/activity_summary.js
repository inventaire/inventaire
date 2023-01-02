import CONFIG from 'config'
import _ from '#builders/utils'
import { findOneWaitingForSummary } from '#controllers/user/lib/summary'
import { oneHour } from '#lib/time'
import sendActivitySummary from './send_activity_summary.js'

const { maxEmailsPerHour } = CONFIG.activitySummary
const emailsInterval = oneHour / maxEmailsPerHour

export default function () {
  _.info(CONFIG.activitySummary, 'activity summary')
  setInterval(sendOneUserSummary, emailsInterval)
}

const sendOneUserSummary = async () => {
  try {
    const user = await findOneWaitingForSummary()
    await sendActivitySummary(user)
  } catch (err) {
    _.error(err, 'waitingForSummary err')
  }
}
