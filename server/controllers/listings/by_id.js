const { byIdsWithElements } = require('controllers/listings/lib/listings')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const error_ = require('lib/error/error')
const { paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  id: {},
  // Elements pagination
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async ({ id, limit, offset, reqUserId }, req) => {
  const [ listing ] = await byIdsWithElements(id, reqUserId)
  if (!listing) throw error_.notFound({ id })

  const authorizedListings = await filterVisibleDocs([ listing ], reqUserId)
  if (authorizedListings.length === 0) {
    throw error_.unauthorized(req, 'unauthorized list access', { list: id })
  }
  return {
    list: listing,
    elements: await paginateElements(listing, offset, limit)
  }
}

const paginateElements = (listing, offset, limit) => {
  const { elements } = listing
  const page = paginate(elements, { offset, limit })
  return page.items
}

module.exports = { sanitization, controller }
