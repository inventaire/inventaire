const _ = require('builders/utils')
const { isNonEmptyArray } = require('lib/boolean_validations')
const listings_ = require('controllers/listings/lib/listings')
const elements_ = require('controllers/listings/lib/elements')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const { paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
  'with-elements': {
    optional: true,
    generic: 'boolean',
  },
  context: {
    optional: true
  },
}

const controller = async ({ users, offset, limit, context, withElements, reqUserId }) => {
  const foundListings = await listings_.byCreators(users)
  const allVisibleListings = await filterVisibleDocs(foundListings, reqUserId)
  const { items: authorizedListings } = paginate(allVisibleListings, { offset, limit, context })
  if (withElements && isNonEmptyArray(authorizedListings)) {
    await assignElementsToLists(authorizedListings)
  }
  return {
    lists: authorizedListings,
  }
}

const assignElementsToLists = async authorizedListings => {
  const authorizedListingsIds = authorizedListings.map(_.property('_id'))
  const foundElements = await elements_.byListings(authorizedListingsIds)
  const elementsByList = _.groupBy(foundElements, 'list')
  authorizedListings.forEach(assignElementsToList(elementsByList))
}

const assignElementsToList = elementsByList => listing => {
  listing.elements = elementsByList[listing._id] || []
}

module.exports = { sanitization, controller }
