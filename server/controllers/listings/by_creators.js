const listings_ = require('controllers/listings/lib/listings')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const { paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
}
const controller = async ({ users, offset, limit, reqUserId }) => {
  const foundListings = await listings_.byCreators(users)
  const allVisibleListings = await filterVisibleDocs(foundListings, reqUserId)
  const { items: authorizedListings } = paginate(allVisibleListings, { offset, limit })
  return {
    lists: authorizedListings,
  }
}

module.exports = { sanitization, controller }
