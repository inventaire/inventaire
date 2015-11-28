CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'
transporter_ = require '../transporter'
buildEmail = require './build_email'
{ disableUserUpdate } = CONFIG.activitySummary

# it can be convenient in development to disable user update
# to keep generate the same email from a given test user
if disableUserUpdate
  updateUser = (userId)-> _.warn userId, 'disabledUserUpdate'
else
  updateUser = user_.justReceivedActivitySummary

module.exports = (user)->
  unless user? then return _.info 'no user waiting for summary'

  userId = user._id

  buildEmail user
  .then transporter_.sendMail
  .then updateUser.bind(null, userId)
  .catch _.Error('activity summary')
