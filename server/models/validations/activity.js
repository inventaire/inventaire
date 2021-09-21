const assert_ = require('lib/utils/assert_types')
const { pass, BoundedString } = require('./common')
const activityTypes = [ 'Follow', 'Create' ]
const objectTypes = [ 'Note' ]
const actorTypes = [ 'Person' ]
const contentLimit = 256
const error_ = require('lib/error/error')

const validateAnObject = validations => obj => {
  Object.keys(obj).forEach(key => {
    if (!Object.keys(validations).includes(key)) {
      throw error_.new(`invalid attribute: ${key}`, 400, { obj })
    }
    validations.pass(key, obj[key])
  })
  return true
}

const objectValidations = {
  pass,
  type: type => objectTypes.includes(type),
  content: BoundedString(1, contentLimit),
  name: BoundedString(1, 80),
  items: itemsMetadata => {
    assert_.number(itemsMetadata.since)
    assert_.number(itemsMetadata.until)
    return true
  }
}

const actorValidations = {
  pass,
  type: type => actorTypes.includes(type),
  username: BoundedString(1, 80),
  uri: BoundedString(1, 256),
}

const baseActivityValidations = {
  pass,
  type: type => activityTypes.includes(type),
  object: validateAnObject(objectValidations),
  externalId: BoundedString(1, 256),
  actor: validateAnObject(actorValidations),
}

module.exports = { baseActivityValidations, objectValidations }
