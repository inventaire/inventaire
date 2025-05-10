import { getListingWithElements } from '#controllers/listings/lib/listings'
import { notFoundError, unauthorizedError } from '#lib/error/error'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { Req } from '#types/server'

// TODO: actually implement pagination
const sanitization = {
  id: {},
  // Elements pagination
  limit: { optional: true },
  offset: { optional: true },
} as const

async function controller ({ id, reqUserId }: SanitizedParameters, req: Req) {
  const listing = await getListingWithElements(id)
  if (!listing) throw notFoundError({ id })

  const authorizedListings = await filterVisibleDocs([ listing ], reqUserId)
  if (authorizedListings.length === 0) {
    throw unauthorizedError(req, 'unauthorized list access', { list: id })
  }
  return {
    list: listing,
  }
}

export default { sanitization, controller }
