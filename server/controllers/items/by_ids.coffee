__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ validateQuery, addUsersData, listingIs } = require './lib/queries_commons'
{ omitPrivateAttributes } = require './lib/filter_private_attributes'
{ network:networkListings } = require './lib/listings_lists'

module.exports = (req, res)->
  reqUserId = req.user?._id
  validateQuery req.query, 'ids', _.isItemId
  .then (ids)->
    promises_.all [
      items_.byIds ids
      relations_.getUserFriendsAndCoGroupsMembers reqUserId
    ]
  .spread filterAuthorizedItems(reqUserId)
  .then addUsersData
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

filterAuthorizedItems = (reqUserId)-> (foundItems, networkIds)->
  unless reqUserId?
    publicItems = foundItems
      .filter listingIs('public')
      .map omitPrivateAttributes

    return { public: publicItems }

  items = { user: [], network: [], public: [] }

  for item in foundItems
    { owner:ownerId, listing } = item

    if ownerId is reqUserId
      items.user.push item

    else if ownerId in networkIds
      # Filter-out private item for network users
      if listing isnt 'private'
        items.network.push omitPrivateAttributes(item)

    else
      # Filter-out all non-public items for non-network users
      if listing is 'public'
        items.public.push omitPrivateAttributes(item)

  return items
