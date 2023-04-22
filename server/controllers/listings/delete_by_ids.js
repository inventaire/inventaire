import elements_ from '#controllers/listings/lib/elements'
import { bulkDeleteListings, getListingsByIds, validateListingOwnership } from '#controllers/listings/lib/listings'

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }) => {
  const listings = await getListingsByIds(ids, reqUserId)
  validateListingOwnership(reqUserId, listings)
  const [ deletedElements ] = await Promise.all([
    elements_.deleteListingsElements(listings),
    bulkDeleteListings(listings),
  ])
  return {
    ok: true,
    lists: listings,
    elements: deletedElements,
  }
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'deletion' ],
}
