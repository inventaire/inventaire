import { pick } from 'lodash-es'
import { getElementById, updateElementDocAttributes } from '#controllers/listings/lib/elements'
import { getListingById, getListingsByIdsWithElements, validateListingOwnership } from '#controllers/listings/lib/listings'
import { notFoundError } from '#lib/error/error'
import { attributes } from '#models/element'
import type { ListingElement } from '#types/element'
import type { Listing } from '#types/listing'

const sanitization = {
  id: {},
  comment: { optional: true },
  ordinal: { optional: true },
}

const controller = async params => {
  const { id, reqUserId, ordinal } = params
  const element: ListingElement = await getElementById(id)

  if (!element) throw notFoundError({ elementId: id })

  let listing: Listing, elements: ListingElement[]
  if (ordinal || ordinal === 0) {
    const [ listingWithElements ] = await getListingsByIdsWithElements([ element.list ])
    validateListingOwnership(reqUserId, listingWithElements);
    ({ elements } = listingWithElements)
  } else {
    listing = await getListingById(element.list)
    validateListingOwnership(reqUserId, listing)
  }

  const newAttributes = pick(params, attributes.updatable)
  return updateElementDocAttributes(element, newAttributes, elements)
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'updateElement' ],
}
