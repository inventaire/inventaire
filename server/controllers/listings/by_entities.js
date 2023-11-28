import { groupBy, keyBy, map, uniq } from 'lodash-es'
import { paginate } from '#controllers/items/lib/queries_commons'
import { getElementsByListingsAndEntity, getElementsByEntities } from '#controllers/listings/lib/elements'
import { getListingsByIdsWithElements } from '#controllers/listings/lib/listings'
import { isNonEmptyArray, isNonEmptyPlainObject } from '#lib/boolean_validations'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'

const sanitization = {
  uris: {},
  lists: { optional: true },
  limit: { optional: true },
  offset: { optional: true },
}

const controller = async ({ uris, lists, offset, limit, reqUserId }) => {
  let foundElements
  if (lists) {
    foundElements = await getElementsByListingsAndEntity(lists, uris)
  } else {
    foundElements = await getElementsByEntities(uris)
  }
  // uniq here implies that a listing cannot refer several times to the same entity
  const listingsIds = uniq(map(foundElements, 'list'))
  const foundListings = await getListingsByIdsWithElements(listingsIds, reqUserId)
  const listings = await filterVisibleDocs(foundListings, reqUserId)
  const { items: authorizedListings } = paginate(listings, { offset, limit })
  const listingsByUris = {}
  const elementsByUris = groupBy(foundElements, 'uri')
  uris.forEach(assignListingsByUris(authorizedListings, elementsByUris, listingsByUris))
  return {
    lists: listingsByUris,
  }
}

export default { sanitization, controller }

const assignListingsByUris = (listings, elementsByUris, listingsByUris) => uri => {
  const listingsElements = elementsByUris[uri]
  if (!isNonEmptyArray(listingsElements)) {
    listingsByUris[uri] = []
    return
  }
  const listingsByIds = keyBy(listings, '_id')
  if (isNonEmptyPlainObject(listingsByIds)) {
    listingsByUris[uri] = Object.values(listingsByIds)
  }
  return listingsByUris
}
