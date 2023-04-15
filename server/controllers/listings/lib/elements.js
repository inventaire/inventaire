import { map } from 'lodash-es'
import _ from '#builders/utils'
import dbFactory from '#db/couchdb/base'
import { error_ } from '#lib/error/error'
import Element from '#models/element'

const db = await dbFactory('elements')

export const byId = db.get
export const byIds = db.byIds
export async function byEntities (uris) {
  return db.viewByKeys('byEntities', uris)
}
export async function byListingsAndEntity (listingsIds, entitiesUris) {
  const keys = _.combinations(listingsIds, entitiesUris)
  return db.viewByKeys('byListAndEntity', keys)
}
export async function byListings (listingsIds) {
  return db.viewByKeys('byListings', listingsIds)
}
export const bulkDelete = db.bulkDelete
export async function deleteListingsElements (listings) {
  const listingIds = map(listings, '_id')
  const listingsElements = await byListings(listingIds)
  if (_.isNonEmptyArray(listingsElements)) {
    await bulkDelete(listingsElements)
  }
  return listingsElements
}
export async function create ({ listing, uris, userId }) {
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
