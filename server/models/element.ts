import { clone } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import type { ListingElement } from '#types/element'
import commonValidations from './validations/common.js'

const { pass, entityUri, couchUuid, nonNegativeInteger } = commonValidations

const validations = {
  pass,
  uri: entityUri,
  list: couchUuid,
  ordinal: nonNegativeInteger,
}

const attributes = {
  validAtCreation: [
    'list',
    'uri',
    'ordinal',
  ],
  updatable: [
    'ordinal',
    'uri',
  ],
}

export function createElementDoc (element) {
  assert_.object(element)
  assert_.string(element.uri)
  assert_.string(element.list)
  assert_.number(element.ordinal)

  const newElement: Partial<ListingElement> = {}
  Object.keys(element).forEach(attribute => {
    if (!attributes.validAtCreation.includes(attribute)) {
      throw newError('invalid attribute', 400, { attribute, element })
    }
    validations.pass(attribute, element[attribute])
    newElement[attribute] = element[attribute]
  })

  newElement.created = Date.now()

  return newElement
}

export function updateElementDoc (newAttributes, oldElement) {
  assert_.object(newAttributes)
  assert_.object(oldElement)

  const newElement = clone(oldElement)

  const passedAttributes = Object.keys(newAttributes)

  for (const attribute of passedAttributes) {
    if (!attributes.updatable.includes(attribute)) {
      throw newError('invalid attribute', 400, { attribute, oldElement })
    }
    const newVal = newAttributes[attribute]

    validations.pass(attribute, newVal)
    newElement[attribute] = newVal
  }

  const now = Date.now()
  newElement.updated = now
  return newElement
}
