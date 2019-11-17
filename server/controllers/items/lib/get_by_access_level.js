// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { filterPrivateAttributes } = require('./filter_private_attributes')

// Working around the circular dependency
let items_
const lateRequire = () => items_ = require('./items')
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
