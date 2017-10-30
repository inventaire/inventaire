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
  # Group items in an object of owners ID,
  # then select only x firsts items from each owner
  # turn object into flattened array

  itemsLimit = 15
  maxItemsPerOwner = 3

  _(items)
  .groupBy itemOwner
  .map (items, _)-> items.slice(0, maxItemsPerOwner)
  .flatten()
  .values()
  .slice 0, itemsLimit
  .shuffle()
  .value() # wrapping lodash .chain() function

itemOwner = (item)-> item.owner

bundleOwnersData = (res, reqUserId, items)->
  unless items?.length > 0
    throw error_.new 'no item found', 404

  users = getItemsOwners items
  user_.getUsersByIds reqUserId, users
  .then (users)-> res.json { items, users }

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq users
