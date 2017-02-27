__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ validateQuery, addUsersData, listingIs, Paginate } = require './lib/queries_commons'
{ omitPrivateAttributes } = require './lib/filter_private_attributes'

module.exports = (req, res)->
  reqUserId = req.user?._id
  validateQuery req.query, 'ids', _.isItemId
  .spread (ids, limit, offset)->
    promises_.all [
      items_.byIds ids
      getNetworkIds reqUserId
    ]
    .spread filterAuthorizedItems(reqUserId)
    .then Paginate(limit, offset)
  .then addUsersData(reqUserId)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

getNetworkIds = (reqUserId)->
  if reqUserId? then return relations_.getUserFriendsAndCoGroupsMembers reqUserId
  else return

filterAuthorizedItems = (reqUserId, limit, offset)-> (items, networkIds)->
  items
  .map filterByAuthorization(reqUserId, networkIds)
  # Keep non-nullified items
  .filter _.identity

filterByAuthorization = (reqUserId, networkIds)-> (item)->
  { owner:ownerId, listing } = item

  if ownerId is reqUserId then return item

  else if ownerId in networkIds
    # Filter-out private item for network users
    if listing isnt 'private' then return omitPrivateAttributes(item)

  else
    # Filter-out all non-public items for non-network users
    if listing is 'public' then return omitPrivateAttributes(item)
