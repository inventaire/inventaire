import { clone, isEqual } from 'lodash-es'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { arrayIncludes } from '#lib/utils/base'
import type { Listing } from '#types/listing'
import attributes from './attributes/listing.js'
import validations from './validations/listing.js'

export function createListingDoc (listing) {
  assert_.object(listing)
  assert_.string(listing.creator)
  assert_.string(listing.name)

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

export function updateListingDocAttributes (oldListing, newAttributes, creatorId) {
  assert_.object(oldListing)
  assert_.object(newAttributes)
  if (oldListing.creator !== creatorId) {
    throw newError('wrong user', 403, oldListing.creator)
  }
  for (const attr of Object.keys(newAttributes)) {
    if (!(arrayIncludes(attributes.updatable, attr))) {
      throw newError(`invalid attribute: ${attr}`, 400, oldListing)
    }
  }
  const updatedListing = clone(oldListing)
  for (const attr of Object.keys(newAttributes)) {
    const newVal = newAttributes[attr] || defaultValues[attr]
    validations.pass(attr, newVal)
    updatedListing[attr] = newVal
  }

  if (isEqual(updatedListing, oldListing)) {
    throw newError('nothing to update', 400, newAttributes)
  }

  updatedListing.updated = Date.now()
  return updatedListing
}

const defaultValues = {
  description: '',
  visibility: [],
}
