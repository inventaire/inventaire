// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const User = __.require('models', 'user')
const sendActivitySummary = require('./send_activity_summary')

const { oneHour } = __.require('lib', 'times')
const { maxEmailsPerHour } = CONFIG.activitySummary
const emailsInterval = oneHour / maxEmailsPerHour

module.exports = () => {
  _.info(CONFIG.activitySummary, 'activity summary')
  return setInterval(sendOneUserSummary, emailsInterval)
}

const sendOneUserSummary = () => user_.findOneWaitingForSummary()
.then(sendActivitySummary)
.catch(_.Error('waitingForSummary err'))
