import { getElementById } from '#controllers/listings/lib/elements'
import { getListingById } from '#controllers/listings/lib/listings'
import { newError, notFoundError } from '#lib/error/error'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { ListingElement } from '#types/element'

const sanitization = {
  id: {},
} as const

async function controller ({ id, reqUserId }: SanitizedParameters) {
  const element: ListingElement = await getElementById(id)
    .catch(err => {
      if (err.statusCode === 404) throw notFoundError({ id })
      else throw err
    })
  const listing = await getListingById(element.list)
  const visibleListings = await filterVisibleDocs([ listing ], reqUserId)
  if (visibleListings.length === 0) {
    throw newError('unauthorized access', 403, { id })
  }
  return {
    element,
    list: listing,
  }
}

export default { sanitization, controller }
