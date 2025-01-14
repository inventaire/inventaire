import { clone, isEqual } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assertObject, assertString } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import type { Listing } from '#types/listing'
import attributes from './attributes/listing.js'
import validations from './validations/listing.js'

export function createListingDoc (listing: Listing) {
  assertObject(listing)
  assertString(listing.creator)
  assertString(listing.name)

  listing.type ??= 'work'
  const newListing: Partial<Listing> = {}
  Object.keys(listing).forEach(key => {
    const value = listing[key] || defaultValues[key]
    if (!attributes.validAtCreation.includes(key)) {
      throw newError(`invalid attribute: ${value}`, 400, { list: listing, key, value })
    }
    validations.pass(key, value)
    newListing[key] = value
  })

  newListing.created = Date.now()

  return newListing
}

export function updateListingDocAttributes (oldListing: Listing, newAttributes, creatorId) {
  assertObject(oldListing)
  assertObject(newAttributes)
  if (oldListing.creator !== creatorId) {
    throw newError('wrong user', 403, { creator: oldListing.creator })
  }
  for (const attr of Object.keys(newAttributes)) {
    if (!(arrayIncludes(attributes.updatable, attr))) {
      throw newError(`invalid attribute: ${attr}`, 400, { oldListing })
    }
  }
  const updatedListing = clone(oldListing)
  for (const attr of Object.keys(newAttributes)) {
    const newVal = newAttributes[attr] || defaultValues[attr]
    validations.pass(attr, newVal)
    updatedListing[attr] = newVal
  }

  if (isEqual(updatedListing, oldListing)) {
    throw newError('nothing to update', 400, { newAttributes })
  }

  updatedListing.updated = Date.now()
  return updatedListing
}

const defaultValues = {
  description: '',
  visibility: [],
}
