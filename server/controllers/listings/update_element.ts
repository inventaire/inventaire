import { pick } from 'lodash-es'
import { getElementById, updateElementDocAttributes } from '#controllers/listings/lib/elements'
import { getListingById, getListingWithElements, validateListingOwnership } from '#controllers/listings/lib/listings'
import { checkSpamContent } from '#controllers/user/lib/spam'
import { notFoundError } from '#lib/error/error'
import { attributes } from '#models/element'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { ListingElement } from '#types/element'
import type { Listing } from '#types/listing'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {
  id: {},
  comment: {
    canBeNull: true,
    optional: true,
  },
  ordinal: { optional: true },
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { id, reqUserId, ordinal, comment } = params
  const element: ListingElement = await getElementById(id)

  if (!element) throw notFoundError({ elementId: id })
  await checkSpamContent(req.user, comment)

  let listing: Listing
  let elements: ListingElement[]
  if (ordinal != null) {
    const listingWithElements = await getListingWithElements(element.list)
    validateListingOwnership(reqUserId, listingWithElements)
    ;({ elements } = listingWithElements)
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
