const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')

const { pass, userId, username, email, userImg, boolean, position, BoundedString } = require('./common')
const { creationStrategies, notificationsSettings } = require('../attributes/user')

const validations = module.exports = {
  pass,
  userId,
  username,
  email,
  password: BoundedString(8, 5000),
  // Accepting second level languages (like es-AR), but only using first level yet
  language: _.isLang,
  picture: userImg,
  creationStrategy: creationStrategy => creationStrategies.includes(creationStrategy),
  bio: BoundedString(0, 1000),
  settings: boolean,
  position,
  summaryPeriodicity: days => Number.isInteger(days) && days >= 1
}

const deepAttributes = {
  settings: {
    notifications: {}
  }
}

for (const setting of notificationsSettings) {
  deepAttributes.settings.notifications[setting] = true
}

validations.deepAttributesExistance = attribute => _.get(deepAttributes, attribute) != null
