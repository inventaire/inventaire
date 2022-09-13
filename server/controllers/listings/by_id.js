const { byIdsWithSelections } = require('controllers/listings/lib/listings')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const error_ = require('lib/error/error')
const { paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  id: {},
  // Selections pagination
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async ({ id, withSelections, limit, offset, reqUserId }, req) => {
  const [ listing ] = await byIdsWithSelections(id, reqUserId)
  if (!listing) throw error_.notFound({ id })

  const authorizedListings = await filterVisibleDocs([ listing ], reqUserId)
  if (authorizedListings.length === 0) {
    throw error_.unauthorized(req, 'unauthorized list access', { list: id })
  }
  return {
    list: listing,
    selections: await paginateSelections(listing, offset, limit)
  }
}

const paginateSelections = (listing, offset, limit) => {
  const { selections } = listing
  const page = paginate(selections, { offset, limit })
  return page.items
}

module.exports = { sanitization, controller }
