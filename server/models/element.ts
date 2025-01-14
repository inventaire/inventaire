import { clone, isEqual } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assertObject, assertString } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import { findNewOrdinal } from '#lib/utils/lexicographic_ordinal'
import type { ListingElement } from '#types/element'
import commonValidations from './validations/common.js'
import type { OverrideProperties } from 'type-fest'

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
    'list',
    'uri',
    'ordinal',
    'comment',
  ],
  // attributes which can directly be updated through an API endpoint
  apiUpdatable: [
    'comment',
  ],
} as const

export function createElementDoc (element: Pick<ListingElement, 'list' | 'uri' | 'ordinal'>) {
  assertObject(element)
  assertString(element.uri)
  assertString(element.list)
  assertString(element.ordinal)

  const newElement: Partial<ListingElement> = {}
  Object.keys(element).forEach(attribute => {
    if (!arrayIncludes(attributes.validAtCreation, attribute)) {
      throw newError('invalid attribute', 400, { attribute, element })
    }
    validations.pass(attribute, element[attribute])
    newElement[attribute] = element[attribute]
  })

  newElement.created = Date.now()

  return newElement
}

export type ListingElementNewAttributes = OverrideProperties<Partial<Pick<ListingElement, typeof attributes.updatable[number]>>, {
  // The ordinal must be passed as a number, but will be converted to a string
  ordinal?: number
}>

export function updateElementDoc (newAttributes: ListingElementNewAttributes, oldElement: ListingElement, listingElements?: ListingElement[]) {
  assertObject(newAttributes)
  assertObject(oldElement)
  const newElement = clone(oldElement)

  const passedAttributes = Object.keys(newAttributes)

  for (const attribute of passedAttributes) {
    if (!arrayIncludes(attributes.updatable, attribute)) {
      throw newError('invalid attribute', 400, { attribute, oldElement })
    }
    let newVal
    if (attribute === 'ordinal') {
      newVal = findNewOrdinal(oldElement, listingElements, newAttributes.ordinal)
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
