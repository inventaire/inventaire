import { map, maxBy } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { combinations } from '#lib/utils/base'
import { createElementDoc, updateElementDoc } from '#models/element'
import type { ListingElement } from '#types/element'

const db = await dbFactory('elements')

export const getElementById = db.get<ListingElement>

export const getElementsByIds = db.byIds<ListingElement>

export async function getElementsByEntities (uris) {
  return db.getDocsByViewKeys<ListingElement>('byEntities', uris)
}

export async function getElementsByListingsAndEntity (listingsIds, entitiesUris) {
  const keys = combinations(listingsIds, entitiesUris)
  return db.getDocsByViewKeys<ListingElement>('byListAndEntity', keys)
}

export async function getElementsByListings (listingsIds) {
  return db.getDocsByViewKeys<ListingElement>('byListings', listingsIds)
}

export const bulkDeleteElements = db.bulkDelete

export async function deleteListingsElements (listings) {
  const listingIds = map(listings, '_id')
  const listingsElements = await getElementsByListings(listingIds)
  if (isNonEmptyArray(listingsElements)) {
    await bulkDeleteElements(listingsElements)
  }
  return listingsElements
}

export async function createListingElements ({ listing, uris, userId }) {
  const listingId = listing._id
  if (listing.creator !== userId) {
    throw newError('wrong user', 403, { userId, listingId })
  }
  const elements = uris.map(uri => {
    const ordinal = highestOrdinal(listing.elements) + 1
    return createElementDoc({
      list: listingId,
      uri,
      ordinal,
    })
  })
  const res = await db.bulk(elements)
  const elementsIds = map(res, 'id')
  return db.fetch<ListingElement>(elementsIds)
}

export async function bulkUpdateElements ({ oldElements, attribute, value }) {
  const elementUpdateData = { [attribute]: value }
  const newElements = oldElements.map(oldElement => updateElementDoc(elementUpdateData, oldElement))
  return elementsBulkUpdate(newElements)
}

const elementsBulkUpdate = db.bulk

function highestOrdinal (elements: ListingElement[]) {
  if (elements.length === 0) return -1

  const highestOrdinalElement = maxBy(elements, 'ordinal')
  return highestOrdinalElement.ordinal
}
