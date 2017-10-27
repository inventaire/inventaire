__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'

module.exports = (req, res)->
  { query } = req
  assertImage = query['assert-image'] is 'true'
  reqUserId = req.user?._id

  items_.publicByDate 100, 0, assertImage, reqUserId
  .then selectRecentItems
  .then bundleOwnersData.bind(null, res, reqUserId)
  .catch error_.Handler(req, res)

selectRecentItems = (items)->
  itemsLimit = 15
  maxItemsPerOwner = 3

  Promise.resolve _.groupBy items, (item)-> item.owner
  .then (itemsByOwner)->
    _.map itemsByOwner, (items)->
      items.slice 0, maxItemsPerOwner
  .then (limitedItemsByOwner)->
    _.flatten _.values limitedItemsByOwner
  .then (allRecentItems)->
    allRecentItems.slice 0, itemsLimit

bundleOwnersData = (res, reqUserId, items)->
  unless items?.length > 0
    throw error_.new 'no item found', 404

  users = getItemsOwners items
  user_.getUsersByIds reqUserId, users
  .then (users)-> res.json { items, users }

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq users
