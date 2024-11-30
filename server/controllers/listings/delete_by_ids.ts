import { deleteListingsElements } from '#controllers/listings/lib/elements'
import { bulkDeleteListings, getListingsByIds, validateListingsOwnership } from '#controllers/listings/lib/listings'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  ids: {},
}

async function controller ({ ids, reqUserId }: SanitizedParameters) {
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
