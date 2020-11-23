const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { filterPrivateAttributes } = require('./filter_private_attributes')
const db = __.require('couch', 'base')('items')

const bundleListings = listingsTypes => async (usersIds, reqUserId, opts = {}) => {
  usersIds = _.forceArray(usersIds)
  const listings = _.combinations(usersIds, listingsTypes)
  const view = opts.withoutShelf ? 'byListingWithoutShelf' : 'byListing'
  const items = await db.viewByKeys(view, listings)
  return items.map(filterPrivateAttributes(reqUserId))
}

module.exports = {
  private: bundleListings([ 'public', 'network', 'private' ]),
  network: bundleListings([ 'public', 'network' ]),
  public: bundleListings([ 'public' ])
}
