import { reorderElements } from '#controllers/listings/lib/elements'
import { getListingWithElements, validateListingsOwnership, validateElementsUrisInListing } from '#controllers/listings/lib/listings'
import { newError } from '#lib/error/error'

const sanitization = {
  id: {},
  uris: {},
}

const controller = async ({ id, uris, reqUserId }) => {
  const listing = await getListingWithElements(id)
  validateListingsOwnership(reqUserId, [ listing ])
  const elements = listing.elements
  if (!elements || elements.length === 0) {
    throw newError('no elements to reorder', 400, { list: listing })
  }
  validateElementsUrisInListing(uris, elements)
  await reorderElements(uris, elements)
  const resListing = await getListingWithElements(id)
  return {
    ok: true,
    list: resListing,
  }
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'reorder' ],
}
