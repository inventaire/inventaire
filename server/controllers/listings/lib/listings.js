import { map } from 'lodash-es'
import _ from '#builders/utils'
import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import { getElementsByListings, createListingElements, deleteListingsElements } from '#controllers/listings/lib/elements'
import { filterFoundElementsUris } from '#controllers/listings/lib/helpers'
import dbFactory from '#db/couchdb/base'
import { error_ } from '#lib/error/error'
import { validateVisibilityKeys } from '#lib/visibility/visibility'
import listingAttributes from '#models/attributes/listing'
import Listing from '#models/listing'

const { updatable: updateAttributes } = listingAttributes

const db = await dbFactory('lists')

export const getListingById = db.get
export const getListingsByIds = db.byIds
export const getListingsByCreators = ids => db.viewByKeys('byCreator', ids)

export const getListingsByIdsWithElements = async ids => {
  const listings = await getListingsByIds(ids)
  if (!_.isNonEmptyArray(listings)) return []
  const listingIds = map(listings, '_id')
  const elements = await getElementsByListings(listingIds)
  if (!_.isNonEmptyArray(listings)) return []
  const elementsByListing = _.groupBy(elements, 'list')
  listings.forEach(assignElementsToListing(elementsByListing))
  return listings
}

export const createListing = async params => {
  const listing = Listing.create(params)
  const invalidGroupId = await validateVisibilityKeys(listing.visibility, listing.creator)
  if (invalidGroupId) {
    throw error_.new('list creator is not in that group', 400, {
      visibilityKeys: listing.visibility,
      groupId: invalidGroupId,
    })
  }
  return db.postAndReturn(listing)
}

export const updateListingAttributes = async params => {
  const { id, reqUserId } = params
  const newAttributes = _.pick(params, updateAttributes)
  if (newAttributes.visibility) {
    await validateVisibilityKeys(newAttributes.visibility, reqUserId)
  }
  const listing = await db.get(id)
  const updatedList = Listing.updateAttributes(listing, newAttributes, reqUserId)
  return db.putAndReturn(updatedList)
}

export const bulkDeleteListings = db.bulkDelete

export const addListingElements = async ({ listing, uris, userId }) => {
  const currentElements = listing.elements
  const { foundElements, notFoundUris } = filterFoundElementsUris(currentElements, uris)
  await validateExistingEntities(notFoundUris)
  const { docs: createdElements } = await createListingElements({ uris: notFoundUris, listing, userId })
  if (_.isNonEmptyArray(foundElements)) {
    return { ok: true, alreadyInList: foundElements, createdElements }
  }
  return { ok: true, createdElements }
}

export const validateListingOwnership = (userId, listings) => {
  listings = _.forceArray(listings)
  for (const listing of listings) {
    if (listing.creator !== userId) {
      throw error_.new('wrong user', 403, { userId, listId: listing._id })
    }
  }
}

export const getListingWithElements = async (listingId, userId) => {
  const listings = await getListingsByIdsWithElements(listingId, userId)
  return listings[0]
}

export const deleteUserListingsAndElements = async userId => {
  const listings = await getListingsByCreators([ userId ])
  return Promise.all([
    db.bulkDelete(listings),
    deleteListingsElements(listings),
  ])
}

const assignElementsToListing = elementsByListing => listing => {
  listing.elements = elementsByListing[listing._id] || []
}

const validateExistingEntities = async uris => {
  const { notFound } = await getEntitiesByUris({ uris })
  if (_.isNonEmptyArray(notFound)) {
    throw error_.new('entities not found', 403, { uris: notFound })
  }
}
