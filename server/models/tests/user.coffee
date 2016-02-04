CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
notificationsSettingsList = __.require 'sharedLibs', 'notifications_settings_list'

{ pass, userId, username, email, localImg, boolean, position } = require './common-tests'

creationStrategies = ['local']

module.exports = tests =
  pass: pass
  userId: userId
  username: username
  email: email
  password: (password)->  8 <= password.length <=60
  # accepting second level languages (like es-AR) but only using first level yet
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
  picture: localImg
  creationStrategy: (creationStrategy)-> creationStrategy in creationStrategies
  bio: (bio)-> _.isString(bio) and bio.length < 1000
  settings: boolean
  position: position
  summaryPeriodicity: (days)-> Number.isInteger(days) and days >= 1

deepAttributes =
  settings:
    notifications: {}

for setting in notificationsSettingsList
  deepAttributes.settings.notifications[setting] = true

tests.deepAttributesExistance = (attribute)->
  _.get(deepAttributes, attribute)?
