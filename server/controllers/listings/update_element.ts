import { pick } from 'lodash-es'
import { getElementById, updateElementDocAttributes } from '#controllers/listings/lib/elements'
import { filterFoundElementsUris } from '#controllers/listings/lib/helpers'
import { getListingById, getListingWithElements, validateListingOwnership } from '#controllers/listings/lib/listings'
import { checkSpamContent } from '#controllers/user/lib/spam'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { notFoundError, newError } from '#lib/error/error'
import { attributes } from '#models/element'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { ListingElement } from '#types/element'
import type { Listing, ListingWithElements } from '#types/listing'
import type { AuthentifiedReq } from '#types/server'
import type { UserId } from '#types/user'

const sanitization = {
  id: {},
  comment: {
    canBeNull: true,
    optional: true,
  },
  ordinal: { optional: true },
  list: { optional: true },
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { id, reqUserId, ordinal, comment, list } = params
  const element: ListingElement = await getElementById(id)

  if (!element) throw notFoundError({ elementId: id })
  await checkSpamContent(req.user, comment)

  let listing: Listing
  let elements: ListingElement[]

  if (ordinal != null) {
    const listingWithElements: ListingWithElements = await getListingWithElements(element.list)
    validateListingOwnership(reqUserId, listingWithElements)
    ;({ elements } = listingWithElements)
  } else if (list != null) {
    const recipientListing: ListingWithElements = await getListingWithElements(list)
    await validateUpdateListing(reqUserId, element, recipientListing)
    ;({ elements } = recipientListing)
    // Update ordinal to be the last position of the recipient listing
    params.ordinal = elements.length + 1
  } else {
    listing = await getListingById(element.list)
    validateListingOwnership(reqUserId, listing)
  }

  const newAttributes = pick(params, attributes.updatable)
  return updateElementDocAttributes({ element, newAttributes, elements })
}

export default {
  sanitization,
  controller,
  track: [ 'lists', 'updateElement' ],
}

async function validateUpdateListing (reqUserId: UserId, element: ListingElement, recipientListing: ListingWithElements) {
  const listing: Listing = await getListingById(element.list)
  validateListingOwnership(reqUserId, listing)
  validateListingOwnership(reqUserId, recipientListing)
  if (recipientListing._id === listing._id) {
    throw newError('element already belongs to the list', 400, { listId: listing._id })
  }
  const { foundElements } = filterFoundElementsUris(recipientListing.elements, [ element.uri ])
  if (isNonEmptyArray(foundElements)) {
    throw newError('element is already in the list', 400, { listId: listing._id })
  }
}
