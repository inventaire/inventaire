__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
bundleOwnersToItems = require './lib/bundle_owners_to_items'

module.exports = (req, res)->
  { query } = req
  assertImage = query['assert-image'] is 'true'
  reqUserId = req.user?._id

  itemsQueryLimit = 100
  offset = 0
  itemsReturnedLimit = 15
  maxItemsPerOwner = 3

  items_.publicByDate itemsQueryLimit, offset, assertImage, reqUserId
  .then selectRecentItems.bind(null, itemsReturnedLimit, maxItemsPerOwner)
  .then bundleOwnersToItems.bind(null, res, reqUserId)
  .catch error_.Handler(req, res)

selectRecentItems = (itemsReturnedLimit, maxItemsPerOwner, items)->
  _(items)
  .groupBy itemsOwnerId
  .map (ownerItems, _)-> ownerItems.slice(0, maxItemsPerOwner)
  .flatten()
  .values()
  .slice 0, itemsReturnedLimit
  .shuffle()
  # wrapping lodash .chain() function
  .value()

itemsOwnerId = (item)-> item.owner
