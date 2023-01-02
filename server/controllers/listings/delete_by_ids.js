import _ from '#builders/utils'
import elements_ from '#controllers/listings/lib/elements'
import { bulkDeleteListings, getListingsByIdsWithElements, validateListingOwnership } from '#controllers/listings/lib/listings'

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }) => {
  const listingsRes = await getListingsByIdsWithElements(ids, reqUserId)
  const listings = _.compact(listingsRes)
  validateListingOwnership(reqUserId, listings)
  const deletedElements = await elements_.deleteListingsElements(listings)
  await bulkDeleteListings(listings)
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
