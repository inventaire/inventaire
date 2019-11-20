
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { filterPrivateAttributes } = require('./filter_private_attributes')

// Working around the circular dependency
let items_
const lateRequire = () => { items_ = require('./items') }
setTimeout(lateRequire, 0)

const bundleListings = listingsTypes => (usersIds, reqUserId) => {
  usersIds = _.forceArray(usersIds)
  const listings = _.combinations(usersIds, listingsTypes)
  return items_.db.viewByKeys('byListing', listings)
  .map(filterPrivateAttributes(reqUserId))
}

module.exports = {
  private: bundleListings([ 'public', 'network', 'private' ]),
  network: bundleListings([ 'public', 'network' ]),
  public: bundleListings([ 'public' ])
}
