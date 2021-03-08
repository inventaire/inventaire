const CONFIG = require('config')
const __ = require('config').universalPath
const _ = require('builders/utils')
const { findOneWaitingForSummary } = require('controllers/user/lib/summary')
const sendActivitySummary = require('./send_activity_summary')

const { oneHour } = require('lib/time')
const { maxEmailsPerHour } = CONFIG.activitySummary
const emailsInterval = oneHour / maxEmailsPerHour

module.exports = () => {
  _.info(CONFIG.activitySummary, 'activity summary')
  return setInterval(sendOneUserSummary, emailsInterval)
}

const sendOneUserSummary = () => {
  return findOneWaitingForSummary()
  .then(sendActivitySummary)
  .catch(_.Error('waitingForSummary err'))
}
