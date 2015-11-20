__ = require('config').universalPath
error_ = __.require 'lib', 'error/error'

module.exports = (user, notificationLabel)->
  { _id, settings } = user
  { notifications } = settings
  checkSetting _id, notifications, 'global'
  checkSetting _id, notifications, notificationLabel

checkSetting = (userId, notifications, label)->
  # settings might be undefined, defaulting to true (activated)
  if notifications[label] is false
    emailDisabled
      user: userId
      notification: label

emailDisabled = (context)->
  throw error_.new 'email disabled', 'email_disabled', context
