import CONFIG from 'config'
import _ from 'builders/utils'
import { findOneWaitingForSummary } from 'controllers/user/lib/summary'
import sendActivitySummary from './send_activity_summary'
import { oneHour } from 'lib/time'
const { maxEmailsPerHour } = CONFIG.activitySummary
const emailsInterval = oneHour / maxEmailsPerHour

export default () => {
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
