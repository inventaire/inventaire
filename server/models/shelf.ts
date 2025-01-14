import { clone, isEqual } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assertObject, assertString } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import type { NewShelf, Shelf } from '#types/shelf'
import type { UserId } from '#types/user'
import attributes, { type UpdatableShelfAttributes } from './attributes/shelf.js'
import validations from './validations/shelf.js'

export function createShelfDoc (shelf: NewShelf) {
  assertObject(shelf)
  assertString(shelf.owner)
  assertString(shelf.name)

  const newShelf: Partial<Shelf> = {}
  newShelf.visibility = shelf.visibility || []
  Object.keys(shelf).forEach(attribute => {
    if (!arrayIncludes(attributes.validAtCreation, attribute)) {
      throw newError('invalid attribute', 400, { attribute, shelf })
    }
    const value = shelf[attribute] || defaultValues[attribute]?.()
    validations.pass(attribute, value)
    newShelf[attribute] = value
  })

  newShelf.created = Date.now()

  return newShelf as NewShelf
}

export function updateShelfDocAttributes (oldShelf: Shelf, newAttributes: Pick<Shelf, UpdatableShelfAttributes>, userId: UserId) {
  assertObject(oldShelf)
  assertObject(newAttributes)

  if (oldShelf.owner !== userId) {
    throw newError('wrong owner', 403, { owner: oldShelf.owner })
  }

  for (const attr of Object.keys(newAttributes)) {
    if (!(arrayIncludes(attributes.updatable, attr))) {
      throw newError(`invalid attribute: ${attr}`, 400, { oldShelf })
    }
  }

  const updatedShelf = clone(oldShelf)
  for (const attr of Object.keys(newAttributes)) {
    const newVal = newAttributes[attr] || defaultValues[attr]?.()
    validations.pass(attr, newVal)
    updatedShelf[attr] = newVal
  }

  if (isEqual(updatedShelf, oldShelf)) {
    throw newError('nothing to update', 400, { newAttributes })
  }

  updatedShelf.updated = Date.now()
  return updatedShelf
}

const defaultValues = {
  description: () => '',
  visibility: () => [],
}
