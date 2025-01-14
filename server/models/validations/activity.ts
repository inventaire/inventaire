import { newError } from '#lib/error/error'
import { assertNumber } from '#lib/utils/assert_types'
import commonValidations from './common.js'

const { pass, BoundedString } = commonValidations

const activityTypes = [ 'Follow', 'Create' ]
const objectTypes = [ 'Note' ]
const actorTypes = [ 'Person' ]
const contentLimit = 256

const validateAnObject = validations => obj => {
  Object.keys(obj).forEach(key => {
    if (!Object.keys(validations).includes(key)) {
      throw newError(`invalid attribute: ${key}`, 400, { obj })
    }
    validations.pass(key, obj[key])
  })
  return true
}

export const objectValidations = {
  pass,
  type: type => objectTypes.includes(type),
  content: BoundedString(1, contentLimit),
  name: BoundedString(1, 80),
  items: itemsMetadata => {
    assertNumber(itemsMetadata.since)
    assertNumber(itemsMetadata.until)
    return true
  },
}

const actorValidations = {
  pass,
  type: type => actorTypes.includes(type),
  name: BoundedString(1, 80),
  uri: BoundedString(1, 256),
}

export const baseActivityValidations = {
  pass,
  type: type => activityTypes.includes(type),
  object: validateAnObject(objectValidations),
  externalId: BoundedString(1, 256),
  actor: validateAnObject(actorValidations),
}
