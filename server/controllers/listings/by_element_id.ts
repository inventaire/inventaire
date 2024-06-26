import { property } from 'lodash-es'
import { getElementById } from '#controllers/listings/lib/elements'
import { getListingById } from '#controllers/listings/lib/listings'
import { unauthorizedError } from '#lib/error/error'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { ListingElement } from '#types/element'

const sanitization = {
  id: {},
}

async function controller ({ id, req, reqUserId }) {
  const element: ListingElement = await getElementById(id)
  const listing = await getListingById(element.list)
  const allVisibleListings = await filterVisibleDocs([listing], reqUserId)
  if (!allVisibleListings.map(property('_id')).includes(element.list)) {
    throw unauthorizedError(req, 'unauthorized access', { id })
  }
  return {
    element,
    list: listing,
  }
}

export default { sanitization, controller }
