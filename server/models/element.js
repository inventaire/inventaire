import _ from '#builders/utils'
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
  updatable: [
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

  update: (newAttributes, oldElement) => {
    assert_.object(newAttributes)
    assert_.object(oldElement)

    const newElement = _.clone(oldElement)

    const passedAttributes = Object.keys(newAttributes)

    for (const attribute of passedAttributes) {
      if (!attributes.updatable.includes(attribute)) {
        throw error_.new('invalid attribute', 400, { attribute, oldElement })
      }
      const newVal = newAttributes[attribute]

      validations.pass(attribute, newVal)
      newElement[attribute] = newVal
    }

    const now = Date.now()
    newElement.updated = now
    return newElement
  },
}
