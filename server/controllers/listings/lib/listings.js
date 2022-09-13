const _ = require('builders/utils')
const Listing = require('models/listing')
const db = require('db/couchdb/base')('lists')
const { updatable: updateAttributes } = require('models/attributes/listing')
const { validateVisibilityKeys } = require('lib/visibility/visibility')
const error_ = require('lib/error/error')
const selections_ = require('controllers/listings/lib/selections')
const { filterFoundSelectionsUris } = require('controllers/listings/lib/helpers')
const { tap } = require('lib/promises')
const getEntitiesByUris = require('controllers/entities/lib/get_entities_by_uris')

const listings_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
  byCreators: ids => db.viewByKeys('byCreator', ids),
  byIdsWithSelections: async (ids, userId) => {
    const listings = await listings_.byIds(ids)
    if (!_.isNonEmptyArray(listings)) return []
    const listingIds = listings.map(_.property('_id'))
    const selections = await selections_.byListings(listingIds, userId)
    if (!_.isNonEmptyArray(listings)) return []
    const selectionsByListing = _.groupBy(selections, 'list')
    listings.forEach(assignSelectionsToListing(selectionsByListing))
    return listings
  },
  create: async params => {
    const listing = Listing.create(params)
    const invalidGroupId = await validateVisibilityKeys(listing.visibility, listing.creator)
    if (invalidGroupId) {
      throw error_.new('list creator is not in that group', 400, {
        visibilityKeys: listing.visibility,
        groupId: invalidGroupId
      })
    }
    return db.postAndReturn(listing)
  },
  updateAttributes: async params => {
    const { id, reqUserId } = params
    const newAttributes = _.pick(params, updateAttributes)
    if (newAttributes.visibility) {
      await validateVisibilityKeys(newAttributes.visibility, reqUserId)
    }
    const listing = await db.get(id)
    const updatedList = Listing.updateAttributes(listing, newAttributes, reqUserId)
    return db.putAndReturn(updatedList)
  },
  bulkDelete: db.bulkDelete,
  addSelections: async ({ listing, uris, userId }) => {
    const currentSelections = listing.selections
    const { foundSelections, notFoundUris } = filterFoundSelectionsUris(currentSelections, uris)
    await validateExistingEntities(notFoundUris)
    await selections_.create({ uris: notFoundUris, listing, userId })
    if (_.isNonEmptyArray(foundSelections)) {
      return { ok: true, alreadyInList: foundSelections }
    }
    return { ok: true }
  },
  validateOwnership: (userId, listings) => {
    listings = _.forceArray(listings)
    for (const listing of listings) {
      if (listing.creator !== userId) {
        throw error_.new('wrong user', 403, { userId, listId: listing._id })
      }
    }
  },
  getListingWithSelections: async (listingId, userId) => {
    const listings = await listings_.byIdsWithSelections(listingId, userId)
    return listings[0]
  },
  deleteUserListingsAndSelections: userId => {
    return listings_.byCreators([ userId ])
    .then(tap(selections_.deleteListingsSelections))
    .then(db.bulkDelete)
  },
}

const assignSelectionsToListing = selectionsByListing => listing => {
  listing.selections = selectionsByListing[listing._id] || []
}

const validateExistingEntities = async uris => {
  const { notFound } = await getEntitiesByUris({ uris })
  if (_.isNonEmptyArray(notFound)) {
    throw error_.new('entities not found', 403, { uris: notFound })
  }
}
