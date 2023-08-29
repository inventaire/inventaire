import { map } from 'lodash-es'
import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import { error_ } from '#lib/error/error'
import Element from '#models/element'

const db = await dbFactory('elements')

export const getElementById = db.get

export const getElementsByIds = db.byIds

export async function getElementsByEntities (uris) {
  return db.viewByKeys('byEntities', uris)
}

export async function getElementsByListingsAndEntity (listingsIds, entitiesUris) {
  const keys = _.combinations(listingsIds, entitiesUris)
  return db.viewByKeys('byListAndEntity', keys)
}

export async function getElementsByListings (listingsIds) {
  return db.viewByKeys('byListings', listingsIds)
}

export const bulkDeleteElements = db.bulkDelete

export async function deleteListingsElements (listings) {
  const listingIds = map(listings, '_id')
  const listingsElements = await getElementsByListings(listingIds)
  if (_.isNonEmptyArray(listingsElements)) {
    await bulkDeleteElements(listingsElements)
  }
  return listingsElements
}

export async function createListingElements ({ listing, uris, userId }) {
  const listingId = listing._id
  if (listing.creator !== userId) {
    throw error_.new('wrong user', 403, { userId, listingId })
  }
  const elements = uris.map(uri => Element.create({
    list: listingId,
    uri,
  }))
  const res = await db.bulk(elements)
  const elementsIds = _.map(res, 'id')
  return db.fetch(elementsIds)
}

export async function bulkUpdateElements ({ oldElements, attribute, value }) {
  const itemUpdateData = { [attribute]: value }
  const newElements = oldElements.map(oldElement => Element.update(itemUpdateData, oldElement))
  return elementsBulkUpdate(newElements)
}

const elementsBulkUpdate = db.bulk
