CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
notificationsSettingsList = __.require 'sharedLibs', 'notifications_settings_list'

{ pass, userId, username, email, userImg, boolean, position, BoundedString } = require './common'

creationStrategies = ['local']

module.exports = validations =
  pass: pass
  userId: userId
  username: username
  email: email
  password: BoundedString 8, 128
  # accepting second level languages (like es-AR) but only using first level yet
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
  picture: userImg
  creationStrategy: (creationStrategy)-> creationStrategy in creationStrategies
  bio: BoundedString 0, 1000
  settings: boolean
  position: position
  summaryPeriodicity: (days)-> Number.isInteger(days) and days >= 1

deepAttributes =
  settings:
    notifications: {}

for setting in notificationsSettingsList
  deepAttributes.settings.notifications[setting] = true

validations.deepAttributesExistance = (attribute)->
  _.get(deepAttributes, attribute)?
