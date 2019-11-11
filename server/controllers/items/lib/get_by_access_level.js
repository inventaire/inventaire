CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ filterPrivateAttributes } = require './filter_private_attributes'

# Working around the circular dependency
items_ = null
lateRequire = -> items_ = require './items'
setTimeout lateRequire, 0

bundleListings = (listingsTypes)-> (usersIds, reqUserId)->
  usersIds = _.forceArray usersIds
  listings = _.combinations usersIds, listingsTypes
  items_.db.viewByKeys 'byListing', listings
  .map filterPrivateAttributes(reqUserId)

module.exports =
  private: bundleListings [ 'public', 'network', 'private' ]
  network: bundleListings [ 'public', 'network' ]
  public: bundleListings [ 'public' ]
