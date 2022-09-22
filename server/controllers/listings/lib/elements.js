const _ = require('builders/utils')
const Element = require('models/element')
const db = require('db/couchdb/base')('elements')
const error_ = require('lib/error/error')

const elements_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
  byEntities: async uris => db.viewByKeys('byEntities', uris),
  byListingsAndEntity: async (listingsIds, entitiesUris) => {
    const keys = _.combinations(listingsIds, entitiesUris)
    return db.viewByKeys('byListAndEntity', keys)
  },
  byListings: async listingsIds => db.viewByKeys('byListings', listingsIds),
  bulkDelete: db.bulkDelete,
  deleteListingsElements: async listings => {
    const listingsElements = listings.flatMap(listing => listing.elements)
    await elements_.bulkDelete(listingsElements)
  },
  create: async ({ listing, uris, userId }) => {
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
  },
}
