const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { filterPrivateAttributes } = require('./filter_private_attributes')
const db = __.require('couch', 'base')('items')

const bundleListings = listingsTypes => async (usersIds, reqUserId) => {
  usersIds = _.forceArray(usersIds)
  const listings = _.combinations(usersIds, listingsTypes)
  const items = await db.viewByKeys('byListing', listings)
  return items.map(filterPrivateAttributes(reqUserId))
}

module.exports = {
  private: bundleListings([ 'public', 'network', 'private' ]),
  network: bundleListings([ 'public', 'network' ]),
  public: bundleListings([ 'public' ])
}
