CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
notificationsSettingsList = __.require 'sharedLibs', 'notifications_settings_list'

{ pass, userId, username, email, localImg } = require './common-tests'


module.exports = tests =
  pass: pass
  userId: userId
  username: username
  email: email
  password: (password)->  8 <= password.length <=60
  # accepting second level languages (like es-AR) but only using first level yet
  language: (lang)-> /^\w{2}(-\w{2})?$/.test(lang)
  picture: localImg
  creationStrategy: (creationStrategy)->
    creationStrategy in ['browserid', 'local']
  bio: (bio)-> _.isString(bio) and bio.length < 1000
  settings: (str)-> str is 'true' or str is 'false'
  position: (latLng)->
    # allow the user to delete her position by passing a null value
    if latLng is null then return true
    _.isArray(latLng) and latLng.length is 2 and _.all latLng, _.isNumber

deepAttributes =
  settings:
    notifications: {}

for setting in notificationsSettingsList
  deepAttributes.settings.notifications[setting] = true

tests.deepAttributesExistance = (attribute)->
  _.get(deepAttributes, attribute)?
