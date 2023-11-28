import { get, isArray } from 'lodash-es'
import { isLang, isPropertyUri } from '#lib/boolean_validations'
import userAttributes from '../attributes/user.js'
import commonValidations from './common.js'

const { creationStrategies, settings } = userAttributes

const { pass, userId, username, email, userImg, boolean, position, BoundedString } = commonValidations

const validations = {
  pass,
  userId,
  username,
  email,
  password: BoundedString(8, 5000),
  // Accepting second level languages (like es-AR), but only using first level yet
  language: isLang,
  picture: userImg,
  creationStrategy: creationStrategy => creationStrategies.includes(creationStrategy),
  bio: BoundedString(0, 1000),
  settings: boolean,
  position,
  fediversable: boolean,
  customProperties: props => isArray(props) && props.every(isPropertyUri),
  summaryPeriodicity: days => Number.isInteger(days) && days >= 1,
}

export default validations

const deepAttributes = {
  settings: {},
}

for (const settingCategory in settings) {
  deepAttributes.settings[settingCategory] = {}
  for (const settingName of settings[settingCategory]) {
    deepAttributes.settings[settingCategory][settingName] = true
  }
}

validations.deepAttributesExistance = attribute => get(deepAttributes, attribute) != null
