import { difference, keyBy, map } from 'lodash-es'
import { getListingsByIds, getListingsByIdsWithElements } from '#controllers/listings/lib/listings'
import { error_ } from '#lib/error/error'
import { addWarning } from '#lib/responses'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'

const sanitization = {
  ids: {},
  'with-elements': {
    optional: true,
    generic: 'boolean',
  },
}

const controller = async ({ ids, withElements, reqUserId }, req, res) => {
  const getListings = withElements ? getListingsByIdsWithElements : getListingsByIds
  const foundListings = await getListings(ids, reqUserId)
  const foundListingsIds = map(foundListings, '_id')
  checkNotFoundListing(ids, foundListings, foundListingsIds, res)
  const authorizedListings = await filterVisibleDocs(foundListings, reqUserId)
  checkUnauthorizedListings(ids, authorizedListings, foundListingsIds, req, res)
  const listings = keyBy(authorizedListings, '_id')
  return { lists: listings }
}

const checkNotFoundListing = (ids, foundListings, foundListingsIds, res) => {
  if (foundListings.length === 0) throw error_.notFound({ ids })
  if (foundListings.length !== ids.length) {
    const notFoundListingsIds = difference(ids, foundListingsIds)
    addWarning(res, `listings not found: ${notFoundListingsIds.join(', ')}`)
  }
}

const checkUnauthorizedListings = (ids, authorizedListings, foundListingsIds, req, res) => {
  if (authorizedListings.length === 0) {
    throw error_.unauthorized(req, 'unauthorized listings access', { ids: foundListingsIds })
  }
  if (authorizedListings.length !== ids.length) {
    const authorizedListingsIds = map(authorizedListings, '_id')
    const unauthorizedListingsIds = difference(foundListingsIds, authorizedListingsIds)
    addWarning(res, `unauthorized listings access: ${unauthorizedListingsIds.join(', ')}`)
  }
}

export default { sanitization, controller }
