import { map } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { maxKey, minKey } from '#lib/couch'
import { newError } from '#lib/error/error'
import { combinations } from '#lib/utils/base'
import { getNextHighestOrdinal } from '#lib/utils/lexicographic_ordinal'
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

export async function getElementsByListing (listingId) {
  return db.getDocsByViewQuery<ListingElement>('byListingAndOrdinal', {
    startkey: [ listingId, minKey ],
    endkey: [ listingId, maxKey ],
    include_docs: true,
  })
}

export const bulkDeleteElements = db.bulkDelete

export async function deleteListingsElements (listings) {
  const listingsIds = map(listings, '_id')
  const listingsElements = await getElementsByListings(listingsIds)
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
  const { elements } = listing

  const elementsToCreate = []
  uris.forEach(uri => {
    const ordinal = getNextHighestOrdinal([ ...elements, ...elementsToCreate ])
    const newDoc = createElementDoc({
      list: listingId,
      uri,
      ordinal,
    })
    elementsToCreate.push(newDoc)
  })
  const res = await db.bulk(elementsToCreate)
  const elementsIds = map(res, 'id')
  return db.fetch<ListingElement>(elementsIds)
}

export async function updateElementDocAttributes ({ element, newAttributes, elements }: { element: ListingElement, newAttributes: any, elements: ListingElement[] }) {
  const updatedElement = updateElementDoc(newAttributes, element, elements)
  return db.putAndReturn(updatedElement)
}

export async function bulkUpdateElements ({ oldElements, attribute, value }) {
  const elementUpdateData = { [attribute]: value }
  const newElements = oldElements.map(oldElement => updateElementDoc(elementUpdateData, oldElement))
  return elementsBulkUpdate(newElements)
}

const elementsBulkUpdate = db.bulk
