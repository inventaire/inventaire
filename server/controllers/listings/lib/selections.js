const _ = require('builders/utils')
const Selection = require('models/selection')
const db = require('db/couchdb/base')('selections')
const error_ = require('lib/error/error')

const selections_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
  byEntities: async uris => db.viewByKeys('byEntities', uris),
  byListings: async listingsIds => db.viewByKeys('byListings', listingsIds),
  bulkDelete: db.bulkDelete,
  deleteListingsSelections: async listings => {
    const listingsSelections = listings.flatMap(listing => listing.selections)
    await selections_.bulkDelete(listingsSelections)
  },
  create: async ({ listing, uris, userId }) => {
    const listingId = listing._id
    if (listing.creator !== userId) {
      throw error_.new('wrong user', 403, { userId, listingId })
    }
    const selections = uris.map(uri => Selection.create({
      list: listingId,
      uri,
    }))
    const res = await db.bulk(selections)
    const selectionsIds = _.map(res, 'id')
    return db.fetch(selectionsIds)
  },
}
