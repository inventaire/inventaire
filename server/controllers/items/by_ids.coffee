__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ validateQuery, addUsersData, ownerIs, ownerIn } = require './lib/queries_commons'
filterPrivateAttributes = require './lib/filter_private_attributes'

module.exports = (req, res)->
  userId = req.user?._id
  validateQuery req.query, 'ids', _.isItemId
  .then items_.byIds
  .then filterAuthorizedItems(userId)
  .then addUsersData
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

filterAuthorizedItems = (userId)-> (items)->
  listingIndex = getItemsIndexedByListing _.compact(items)
  results =
    public: listingIndex.public.map filterPrivateAttributes(userId)

  unless userId? then return results

  results.user = filterPrivateItems listingIndex.private, userId
  # 'friends' is the name of the listing open to friends and groups
  # a.k.a the user network
  results.network = filterNetworkItems listingIndex.friends, userId
  return promises_.props results

getItemsIndexedByListing = (items)->
  listingIndex =
    private: []
    friends: []
    public: []

  for item in items
    listingIndex[item.listing].push item

  return listingIndex

filterPrivateItems = (items, userId)-> items.filter ownerIs(userId)

filterNetworkItems = (items, userId)->
  if items.length is 0 then return []

  relations_.getUserFriendsAndCoGroupsMembers userId
  .then (authorizingUsersIds)->
    items
    .filter ownerIn(authorizingUsersIds)
    .map filterPrivateAttributes(userId)
