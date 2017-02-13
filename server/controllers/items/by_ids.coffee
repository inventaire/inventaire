__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
doubleEndpoint = __.require 'lib', 'double_endpoint'
{ addUsersData } = require './lib/queries_commons'

module.exports = doubleEndpoint (req, res, userId)->
  { ids } = req.query

  unless _.isNonEmptyString ids
    return error_.bundle req, res, 'missing ids parameter', 400, req.query

  ids = _.uniq ids.split('|')

  for id in ids
    unless _.isItemId id
      return error_.bundle req, res, 'invalid item id', 400, id

  # fetch all items
  items_.byIds ids
  .then filterAuthorizedItems(userId)
  .then addUsersData
  .then _.Wrap(res, 'items')
  .catch error_.Handler(req, res)

filterAuthorizedItems = (userId)-> (items)->
  listingIndex = getItemsIndexedByListing _.compact(items)
  unless userId? then return _.pick listingIndex, 'public'

  promises_.props
    user: filterPrivateItems listingIndex.private, userId
    network: filterNetworkItems listingIndex.friends, userId
    # keep all public items
    public: listingIndex.public

getItemsIndexedByListing = (items)->
  listingIndex =
    private: []
    friends: []
    public: []

  for item in items
    listingIndex[item.listing].push item

  return listingIndex

filterPrivateItems = (items, userId)-> items.filter (item)-> item.owner is userId

filterNetworkItems = (items, userId)->
  if items.length is 0 then return []

  relations_.getUserFriendsAndCoGroupsMembers userId
  .then (authorizingUsersIds)->
    items.filter (item)-> item.owner in authorizingUsersIds
