import { addListingElements, getListingWithElements, validateListingsOwnership } from '#controllers/listings/lib/listings'
import { notFoundError } from '#lib/error/error'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { ListingWithElements } from '#types/listing'

const sanitization = {
  id: {},
  uris: {},
} as const

async function controller ({ id, uris, reqUserId }: SanitizedParameters) {
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
