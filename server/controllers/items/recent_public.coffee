__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
bundleOwnersToItems = require './lib/bundle_owners_to_items'
itemsQueryLimit = 100
maxItemsPerOwner = 3
offset = 0

module.exports = (req, res)->
  { query } = req
  limit = query.limit or 15
  lang = query.lang or 'en'
  assertImage = _.parseBooleanString query['assert-image']
  reqUserId = req.user?._id

  items_.publicByLangAndDate itemsQueryLimit, offset, lang, assertImage, reqUserId
  .then selectRecentItems(limit, maxItemsPerOwner)
  .then bundleOwnersToItems.bind(null, res, reqUserId)
  .catch error_.Handler(req, res)

selectRecentItems = (limit, maxItemsPerOwner)-> (items)->
  _(items)
  .groupBy itemsOwnerId
  .map (ownerItems, _)-> ownerItems.slice(0, maxItemsPerOwner)
  .flatten()
  .values()
  .slice 0, limit
  .shuffle()
  # wrapping lodash .chain() function
  .value()

itemsOwnerId = (item)-> item.owner
