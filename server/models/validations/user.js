const _ = require('builders/utils')

const { pass, userId, username, email, userImg, boolean, position, BoundedString } = require('./common')
const { creationStrategies, settings } = require('../attributes/user')

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
  fediversable: boolean,
  summaryPeriodicity: days => Number.isInteger(days) && days >= 1
}

const deepAttributes = {
  settings: {}
}

for (const settingCategory in settings) {
  deepAttributes.settings[settingCategory] = {}
  for (const settingName of settings[settingCategory]) {
    deepAttributes.settings[settingCategory][settingName] = true
  }
}

validations.deepAttributesExistance = attribute => _.get(deepAttributes, attribute) != null
