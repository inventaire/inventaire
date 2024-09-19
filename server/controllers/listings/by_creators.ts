import { paginateListings } from '#controllers/listings/lib/helpers'
import { assignElementsToListings, getListingsByCreators } from '#controllers/listings/lib/listings'
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
  const allVisibleListings = await filterVisibleDocs(foundListings, reqUserId)
  const { listings, total, continue: continu } = paginateListings(allVisibleListings, { offset, limit, context })
  if (withElements && isNonEmptyArray(listings)) {
    await assignElementsToListings(listings)
  }
  return {
    lists: listings,
    total,
    continue: continu,
  }
}

export default { sanitization, controller }
