import { addListingElements, getListingWithElements, validateListingsOwnership } from '#controllers/listings/lib/listings'
import { notFoundError } from '#lib/error/error'
import type { ListingWithElements } from '#types/listing'

const sanitization = {
  id: {},
  uris: {},
}

const controller = async ({ id, uris, reqUserId }) => {
  const listing: ListingWithElements = await getListingWithElements(id)
  if (!listing) throw notFoundError({ id })
  const listings: ListingWithElements[] = [ listing ]
  validateListingsOwnership(reqUserId, listings)
  return addListingElements({ listing, uris, userId: reqUserId })
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'addElements' ],
}
