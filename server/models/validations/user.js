let validations
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const { pass, userId, username, email, userImg, boolean, position, BoundedString } = require('./common')
const { creationStrategies, notificationsSettings } = require('../attributes/user')

module.exports = (validations = {
  pass,
  userId,
  username,
  email,
  password: BoundedString(8, 128),
  // accepting second level languages (like es-AR) but only using first level yet
  language: lang => /^\w{2}(-\w{2})?$/.test(lang),
  picture: userImg,
  creationStrategy: creationStrategy => creationStrategies.includes(creationStrategy),
  bio: BoundedString(0, 1000),
  settings: boolean,
  position,
  summaryPeriodicity: days => Number.isInteger(days) && (days >= 1)
})

const deepAttributes = {
  settings: {
    notifications: {}
  }
}

for (const setting of notificationsSettings) {
  deepAttributes.settings.notifications[setting] = true
}

validations.deepAttributesExistance = attribute => _.get(deepAttributes, attribute) != null
