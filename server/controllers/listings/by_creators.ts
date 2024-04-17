import { groupBy, map } from 'lodash-es'
import { getElementsByListings } from '#controllers/listings/lib/elements'
import { paginateListings } from '#controllers/listings/lib/helpers'
import { getListingsByCreators } from '#controllers/listings/lib/listings'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
  'with-elements': {
    optional: true,
    generic: 'boolean',
  },
  context: {
    optional: true,
  },
}

async function controller ({ users, offset, limit, context, withElements, reqUserId }) {
  const foundListings = await getListingsByCreators(users)
  const authorizedListings = await filterVisibleDocs(foundListings, reqUserId)
  const { listings, total, continue: continu } = paginateListings(authorizedListings, { offset, limit, context })
  if (withElements && isNonEmptyArray(listings)) {
    await assignElementsToLists(listings)
  }
  return {
    lists: listings,
    total,
    continue: continu,
  }
}

async function assignElementsToLists (authorizedListings) {
  const authorizedListingsIds = map(authorizedListings, '_id')
  const foundElements = await getElementsByListings(authorizedListingsIds)
  const elementsByList = groupBy(foundElements, 'list')
  authorizedListings.forEach(assignElementsToList(elementsByList))
}

const assignElementsToList = elementsByList => listing => {
  listing.elements = elementsByList[listing._id] || []
}

export default { sanitization, controller }
