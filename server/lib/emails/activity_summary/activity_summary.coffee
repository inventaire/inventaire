CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'
sendActivitySummary = require './send_activity_summary'

{ oneHour } =  __.require 'lib', 'times'
{ periodicity, maxEmailsPerHour } = CONFIG.activitySummary
emailsInterval = oneHour / maxEmailsPerHour

module.exports = ->
  _.info CONFIG.activitySummary, 'activity summary'
  setInterval sendOneUserSummary, emailsInterval

sendOneUserSummary = ->
  user_.findOneWaitingForSummary periodicity
  .then sendActivitySummary
  .catch _.Error('waitingForSummary err')
