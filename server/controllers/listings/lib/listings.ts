import { groupBy, map, pick, difference } from 'lodash-es'
import { getEntitiesByUris } from '#controllers/entities/lib/get_entities_by_uris'
import { createListingElements, deleteListingsElements, getElementsByListing, getElementsByListings } from '#controllers/listings/lib/elements'
import { filterFoundElementsUris } from '#controllers/listings/lib/helpers'
import dbFactory from '#db/couchdb/base'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { validateVisibilityKeys } from '#lib/visibility/visibility'
import listingAttributes from '#models/attributes/listing'
import { createListingDoc, updateListingDocAttributes } from '#models/listing'
import type { ListingElement } from '#types/element'
import type { EntityUri } from '#types/entity'
import type { Listing, ListingId, ListingWithElements } from '#types/listing'
import type { UserId } from '#types/user'

const { updatable: updateAttributes } = listingAttributes

const db = await dbFactory('lists')

export const getListingById = db.get<Listing>
export const getListingsByIds = db.byIds<Listing>
export const getListingsByCreators = ids => db.getDocsByViewKeys<Listing>('byCreator', ids)

type ElementsByListing = Record<ListingId, ListingElement[]>

export async function getListingsByIdsWithElements (ids: ListingId[]) {
  const listings = await getListingsByIds(ids)
  await assignElementsToListings(listings)
  return listings as ListingWithElements[]
}

export async function createListing (params) {
  const listing = createListingDoc(params)
  await validateVisibilityKeys(listing.visibility, listing.creator)
  return db.postAndReturn(listing)
}

export async function updateListingAttributes (params) {
  const { id, reqUserId } = params
  const newAttributes = pick(params, updateAttributes)
  if (newAttributes.visibility) {
    await validateVisibilityKeys(newAttributes.visibility, reqUserId)
  }
  const listing = await db.get<Listing>(id)
  const updatedList = updateListingDocAttributes(listing, newAttributes, reqUserId)
  return db.putAndReturn(updatedList)
}

export const bulkDeleteListings = db.bulkDelete

export async function addListingElements ({ listing, uris, userId }: { listing: ListingWithElements, uris: EntityUri, userId: UserId }) {
  const currentElements = listing.elements || []
  const { foundElements, notFoundUris } = filterFoundElementsUris(currentElements, uris)
  await validateExistingEntities(notFoundUris)
  const { docs: createdElements } = await createListingElements({ uris: notFoundUris, listing, userId })
  const res = { ok: true, createdElements }
  if (isNonEmptyArray(foundElements)) {
    return Object.assign(res, { alreadyInList: foundElements })
  }
  return res
}

export function validateListingsOwnership (userId: UserId, listings: Listing[]) {
  for (const listing of listings) {
    if (listing.creator !== userId) {
      throw newError('wrong user', 403, { userId, listId: listing._id })
    }
  }
}

export const validateElementsUrisInListing = (uris, listingElements) => {
  if (listingElements.length === 0) return true
  const listingElementsUris = map(listingElements, 'uri')
  // truncate array to allow more performant validation on elements subset
  listingElementsUris.length = uris.length
  const urisNotInListing = difference(listingElementsUris, uris)
  if (urisNotInListing.length > 0) {
    throw newError('some elements are not in the list', 400, { uris: urisNotInListing })
  }
}

export async function getListingWithElements (listingId: ListingId) {
  const listing: Listing = await getListingById(listingId)
  if (!listing) return
  const elements = await getElementsByListing(listingId)
  const listingWithElements: ListingWithElements = Object.assign(listing, { elements })
  return listingWithElements
}

export async function deleteUserListingsAndElements (userId: UserId) {
  const listings = await getListingsByCreators([ userId ])
  return Promise.all([
    db.bulkDelete(listings),
    deleteListingsElements(listings),
  ])
}

async function validateExistingEntities (uris: EntityUri[]) {
  const { notFound } = await getEntitiesByUris({ uris })
  if (isNonEmptyArray(notFound)) {
    throw newError('entities not found', 403, { uris: notFound })
  }
}

export async function assignElementsToListings (listings) {
  const listingsIds = map(listings, '_id')
  const elements = await getElementsByListings(listingsIds)
  const elementsByListing: ElementsByListing = groupBy(elements, 'list')
  listings.forEach(assignElementsToListing(elementsByListing))
  return listings as ListingWithElements
}

const assignElementsToListing = (elementsByListing: ElementsByListing) => listing => {
  listing.elements = elementsByListing[listing._id] || []
}
