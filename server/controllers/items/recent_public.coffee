__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
sanitize = __.require 'lib', 'sanitize/sanitize'
bundleOwnersToItems = require './lib/bundle_owners_to_items'
itemsQueryLimit = 100
maxItemsPerOwner = 3
offset = 0

sanitization =
  'assert-image':
    generic: 'boolean'
    default: false
  lang:
    default: 'en'
  limit:
    default: 15

module.exports = (req, res)->
  reqUserId = req.user?._id
  sanitize req, res, sanitization
  .then (input)->
    { assertImage, lang, limit } = input
    items_.publicByLangAndDate itemsQueryLimit, offset, lang, assertImage, reqUserId
    .then selectRecentItems(limit)
  .then bundleOwnersToItems.bind(null, res, reqUserId)
  .catch error_.Handler(req, res)

selectRecentItems = (limit)-> (items)->
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
