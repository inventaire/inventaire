import { error_ } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import commonValidations from './validations/common.js'

const { pass, entityUri, couchUuid } = commonValidations

const validations = {
  pass,
  uri: entityUri,
  list: couchUuid,
}

const attributes = {
  validAtCreation: [
    'list',
    'uri',
  ],
}

export default {
  create: element => {
    assert_.object(element)
    assert_.string(element.uri)
    assert_.string(element.list)

    const newElement = {}
    Object.keys(element).forEach(attribute => {
      if (!attributes.validAtCreation.includes(attribute)) {
        throw error_.new('invalid attribute', 400, { attribute, element })
      }
      validations.pass(attribute, element[attribute])
      newElement[attribute] = element[attribute]
    })

    newElement.created = Date.now()

    return newElement
  },
}
