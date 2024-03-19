import { clone, isEqual } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import type { Shelf } from '#types/shelf'
import type { UserId } from '#types/user'
import attributes, { type UpdatableShelfAttributes } from './attributes/shelf.js'
import validations from './validations/shelf.js'

export function createShelfDoc (shelf) {
  assert_.object(shelf)
  assert_.string(shelf.owner)
  assert_.string(shelf.name)

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

  return newShelf
}

export function updateShelfDocAttributes (oldShelf: Shelf, newAttributes: Pick<Shelf, UpdatableShelfAttributes>, userId: UserId) {
  assert_.object(oldShelf)
  assert_.object(newAttributes)

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
