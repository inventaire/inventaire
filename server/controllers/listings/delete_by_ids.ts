import { deleteListingsElements } from '#controllers/listings/lib/elements'
import { bulkDeleteListings, getListingsByIds, validateListingsOwnership } from '#controllers/listings/lib/listings'

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }) => {
  const listings = await getListingsByIds(ids)
  validateListingsOwnership(reqUserId, listings)
  const [ deletedElements ] = await Promise.all([
    deleteListingsElements(listings),
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
