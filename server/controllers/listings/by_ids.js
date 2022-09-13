const _ = require('builders/utils')
const { byIds, byIdsWithElements } = require('controllers/listings/lib/listings')
const { addWarning } = require('lib/responses')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const error_ = require('lib/error/error')

const sanitization = {
  ids: {},
  'with-elements': {
    optional: true,
    generic: 'boolean'
  }
}

const controller = async ({ ids, withElements, reqUserId }, req, res) => {
  const getListings = withElements ? byIdsWithElements : byIds
  const foundListings = await getListings(ids, reqUserId)
  const foundListingsIds = _.map(foundListings, '_id')
  checkNotFoundListing(ids, foundListings, foundListingsIds, res)
  const authorizedListings = await filterVisibleDocs(foundListings, reqUserId)
  checkUnauthorizedListings(ids, authorizedListings, foundListingsIds, req, res)
  const listings = _.keyBy(authorizedListings, '_id')
  return { lists: listings }
}

const checkNotFoundListing = (ids, foundListings, foundListingsIds, res) => {
  if (foundListings.length === 0) throw error_.notFound({ ids })
  if (foundListings.length !== ids.length) {
    const notFoundListingsIds = _.difference(ids, foundListingsIds)
    addWarning(res, `listings not found: ${notFoundListingsIds.join(', ')}`)
  }
}

const checkUnauthorizedListings = (ids, authorizedListings, foundListingsIds, req, res) => {
  if (authorizedListings.length === 0) {
    throw error_.unauthorized(req, 'unauthorized listings access', { ids: foundListingsIds })
  }
  if (authorizedListings.length !== ids.length) {
    const authorizedListingsIds = _.map(authorizedListings, '_id')
    const unauthorizedListingsIds = _.difference(foundListingsIds, authorizedListingsIds)
    addWarning(res, `unauthorized listings access: ${unauthorizedListingsIds.join(', ')}`)
  }
}

module.exports = { sanitization, controller }
