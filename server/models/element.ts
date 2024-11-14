import { clone, isEqual } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { findNewOrdinal } from '#lib/utils/lexicographic_ordinal'
import type { ListingElement } from '#types/element'
import commonValidations from './validations/common.js'

const { pass, entityUri, couchUuid, BoundedString, boundedString } = commonValidations

const validations = {
  pass,
  uri: entityUri,
  list: couchUuid,
  ordinal: str => boundedString(str, 1, 1000),
  comment: BoundedString(0, 5000),

}

export const attributes = {
  validAtCreation: [
    'list',
    'uri',
    'ordinal',
    'comment',
  ],
  updatable: [
    'uri',
    'ordinal',
    'comment',
  ],
  // attributes which can directly be updated through an API endpoint
  apiUpdatable: [
    'comment',
  ],
}

export function createElementDoc (element) {
  assert_.object(element)
  assert_.string(element.uri)
  assert_.string(element.list)
  assert_.string(element.ordinal)

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

export function updateElementDoc (newAttributes, oldElement, listingElements?) {
  assert_.object(newAttributes)
  assert_.object(oldElement)
  const newElement = clone(oldElement)

  const passedAttributes = Object.keys(newAttributes)

  for (const attribute of passedAttributes) {
    if (!attributes.updatable.includes(attribute)) {
      throw newError('invalid attribute', 400, { attribute, oldElement })
    }
    let newVal
    if (attribute === 'ordinal') {
      newVal = findNewOrdinal(oldElement, listingElements, newAttributes[attribute])
    } else {
      newVal = newAttributes[attribute] || defaultValues[attribute]?.()
      validations.pass(attribute, newVal)
    }
    if (newVal != null) {
      newElement[attribute] = newVal
    }
  }

  if (isEqual(newElement, oldElement)) {
    throw newError('nothing to update', 400, { oldElement })
  }

  const now = Date.now()
  newElement.updated = now
  return newElement
}

const defaultValues = {
  comment: () => '',
  // prevent newAttributes[attribute] to return a falsy 0 value
  ordinal: () => 0,
}
