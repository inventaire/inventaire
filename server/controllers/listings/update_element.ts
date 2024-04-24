import { pick } from 'lodash-es'
import { getElementById, updateElementDocAttributes } from '#controllers/listings/lib/elements'
import { getListingById, validateListingOwnership } from '#controllers/listings/lib/listings'
import { notFoundError } from '#lib/error/error'
import { attributes } from '#models/element'
import type { ListingElement } from '#types/element'
import type { Listing } from '#types/listing'

const sanitization = {
  id: {},
  comment: { optional: true },
}

const controller = async params => {
  const { id, reqUserId } = params
  const element: ListingElement = await getElementById(id)
  const listing: Listing = await getListingById(element.list)
  // Only creators can update an element, for now
  validateListingOwnership(reqUserId, listing)

  if (!element) throw notFoundError({ elementId: id })

  // Do not use updatable to not allow to update ordinal attribute
  const newAttributes = pick(params, attributes.apiUpdatable)
  return updateElementDocAttributes(element, newAttributes)
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'updateElement' ],
}
