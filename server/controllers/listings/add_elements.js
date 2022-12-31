import listings_ from 'controllers/listings/lib/listings'
import error_ from 'lib/error/error'

const sanitization = {
  id: {},
  uris: {}
}

const controller = async ({ id, uris, reqUserId }) => {
  const listing = await listings_.getListingWithElements(id, uris, reqUserId)
  if (!listing) throw error_.notFound({ id })
  listings_.validateOwnership(reqUserId, listing)
  return listings_.addElements({ listing, uris, userId: reqUserId })
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'addElements' ]
}
