import { map } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { maxKey, minKey } from '#lib/couch'
import { newError } from '#lib/error/error'
import { combinations } from '#lib/utils/base'
import { getNextHighestOrdinal } from '#lib/utils/lexicographic_ordinal'
import { createElementDoc, updateElementDoc, type ListingElementNewAttributes } from '#models/element'
import type { ListingElement } from '#types/element'
import type { EntityUri } from '#types/entity'
import type { Listing, ListingId, ListingWithElements } from '#types/listing'
import type { UserId } from '#types/user'

const db = await dbFactory('elements')

export const getElementById = db.get<ListingElement>

export const getElementsByIds = db.byIds<ListingElement>

export async function getElementsByEntities (uris: EntityUri[]) {
  return db.getDocsByViewKeys<ListingElement>('byEntity', uris)
}

export async function getElementsByPreviousEntities (uris: EntityUri[]) {
  return db.getDocsByViewKeys<ListingElement>('byPreviousEntity', uris)
}

export async function getElementsByListingsAndEntity (listingsIds: ListingId[], entitiesUris: EntityUri[]) {
  const keys = combinations(listingsIds, entitiesUris)
  return db.getDocsByViewKeys<ListingElement>('byListAndEntity', keys)
}

export async function getElementsByListings (listingsIds: ListingId[]) {
  return db.getDocsByViewKeys<ListingElement>('byListing', listingsIds)
}

export async function getElementsByListing (listingId: ListingId) {
  return db.getDocsByViewQuery<ListingElement>('byListingAndOrdinal', {
    startkey: [ listingId, minKey ],
    endkey: [ listingId, maxKey ],
    include_docs: true,
  })
}

export const bulkDeleteElements = db.bulkDelete

export async function deleteListingsElements (listings: Listing[]) {
  const listingsIds = map(listings, '_id')
  const listingsElements = await getElementsByListings(listingsIds)
  if (isNonEmptyArray(listingsElements)) {
    await bulkDeleteElements(listingsElements)
  }
  return listingsElements
}

export async function createListingElements ({ listing, uris, userId }: { listing: ListingWithElements, uris: EntityUri[], userId: UserId }) {
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

export async function updateElementDocAttributes ({ element, newAttributes, elements }: { element: ListingElement, newAttributes: ListingElementNewAttributes, elements: ListingElement[] }) {
  const updatedElement = updateElementDoc(newAttributes, element, elements)
  return db.putAndReturn(updatedElement)
}
