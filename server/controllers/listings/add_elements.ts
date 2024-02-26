import { addListingElements, getListingWithElements, validateListingOwnership } from '#controllers/listings/lib/listings'
import { error_ } from '#lib/error/error'

const sanitization = {
  id: {},
  uris: {},
}

const controller = async ({ id, uris, reqUserId }) => {
  const listing = await getListingWithElements(id, uris, reqUserId)
  if (!listing) throw error_.notFound({ id })
  validateListingOwnership(reqUserId, listing)
  return addListingElements({ listing, uris, userId: reqUserId })
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'addElements' ],
}
