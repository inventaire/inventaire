const _ = require('builders/utils')
const selections_ = require('controllers/listings/lib/selections')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const listings_ = require('controllers/listings/lib/listings')
const { paginate } = require('controllers/items/lib/queries_commons')
const { isNonEmptyArray } = require('lib/boolean_validations')

const sanitization = {
  uris: {},
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async ({ uris, offset, limit, reqUserId }) => {
  const foundSelections = await selections_.byEntities(uris)
  // uniq here implies that a listng cannot refer several times to the same entity
  const listingsIds = _.uniq(_.map(foundSelections, 'list'))
  const foundListings = await listings_.byIdsWithSelections(listingsIds, reqUserId)
  const listings = await filterVisibleDocs(foundListings, reqUserId)
  const { items: authorizedListings } = paginate(listings, { offset, limit })
  const listingsByUris = {}
  const selectionsByUris = _.groupBy(foundSelections, 'uri')
  uris.forEach(assignListingsByUris(authorizedListings, selectionsByUris, listingsByUris))
  return {
    lists: listingsByUris
  }
}

module.exports = { sanitization, controller }

const assignListingsByUris = (listings, selectionsByUris, listingsByUris) => uri => {
  const listingsSelections = selectionsByUris[uri]
  if (!isNonEmptyArray(listingsSelections)) {
    listingsByUris[uri] = []
    return
  }
  const listingsByIds = _.keyBy(listings, '_id')
  if (_.isNonEmptyPlainObject(listingsByIds)) {
    listingsByUris[uri] = Object.values(listingsByIds)
  }
  return listingsByUris
}
