import { paginate } from '#controllers/items/lib/queries_commons'
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

const controller = async ({ users, offset, limit, context, withElements, reqUserId }) => {
  const foundListings = await getListingsByCreators(users)
  const allVisibleListings = await filterVisibleDocs(foundListings, reqUserId)
  const { items: authorizedListings } = paginate(allVisibleListings, { offset, limit, context })
  if (withElements && isNonEmptyArray(authorizedListings)) {
    await assignElementsToListings(authorizedListings)
  }
  return {
    lists: authorizedListings,
  }
}

export default { sanitization, controller }
