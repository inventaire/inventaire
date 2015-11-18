CONFIG = require 'config'
__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
User = __.require 'models', 'user'
transporter_ = require '../transporter'
buildEmail = require './build_email'

module.exports = (user)->
  unless user? then return _.info 'no user waiting for summary'

  userId = user._id

  buildEmail user
  .then transporter_.sendMail
  .then user_.justReceivedActivitySummary.bind(null, userId)
  .catch _.Error('activity summary')
