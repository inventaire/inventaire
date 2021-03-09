const _ = require('builders/utils')
const { filterPrivateAttributes } = require('./filter_private_attributes')
const db = require('db/couchdb/base')('items')

const bundleListings = listingsTypes => async (usersIds, reqUserId, options = {}) => {
  usersIds = _.forceArray(usersIds)
  const listings = _.combinations(usersIds, listingsTypes)
  const view = options.withoutShelf ? 'byListingWithoutShelf' : 'byListing'
  const items = await db.viewByKeys(view, listings)
  return items.map(filterPrivateAttributes(reqUserId))
}

module.exports = {
  private: bundleListings([ 'public', 'network', 'private' ]),
  network: bundleListings([ 'public', 'network' ]),
  public: bundleListings([ 'public' ])
}
