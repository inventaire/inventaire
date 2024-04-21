import { addListingElements, getListingWithElements, validateListingsOwnership } from '#controllers/listings/lib/listings'
import { notFoundError } from '#lib/error/error'

const sanitization = {
  id: {},
  uris: {},
}

async function controller ({ id, uris, reqUserId }) {
  const listing = await getListingWithElements(id)
  if (!listing) throw notFoundError({ id })
  validateListingsOwnership(reqUserId, [ listing ])
  return addListingElements({ listing, uris, userId: reqUserId })
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'addElements' ],
}
