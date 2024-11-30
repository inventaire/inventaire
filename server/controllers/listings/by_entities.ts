import { map, uniq } from 'lodash-es'
import { getElementsByListingsAndEntity, getElementsByEntities } from '#controllers/listings/lib/elements'
import { paginateListings } from '#controllers/listings/lib/helpers'
import { getListingsByIdsWithElements } from '#controllers/listings/lib/listings'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  uris: {},
  lists: { optional: true },
  limit: { optional: true },
  offset: { optional: true },
  context: { optional: true },
}

async function controller ({ uris, lists, offset, limit, context, reqUserId }: SanitizedParameters) {
  let foundElements
  if (lists) {
    foundElements = await getElementsByListingsAndEntity(lists, uris)
  } else {
    foundElements = await getElementsByEntities(uris)
  }
  // uniq here implies that a listing cannot refer several times to the same entity
  const listingsIds = uniq(map(foundElements, 'list'))
  const foundListings = await getListingsByIdsWithElements(listingsIds)
  const authorizedListings = await filterVisibleDocs(foundListings, reqUserId)
  const { listings, total, continue: continu } = paginateListings(authorizedListings, { offset, limit, context })
  return {
    lists: listings,
    total,
    continue: continu,
  }
}

export default { sanitization, controller }
