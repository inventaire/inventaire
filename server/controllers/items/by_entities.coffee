__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ validateQuery, addUsersData, Paginate } = require './lib/queries_commons'
{ filterPrivateAttributes } = require './lib/filter_private_attributes'

module.exports = (req, res)->
  reqUserId = req.user?._id
  validateQuery req.query, 'uris', _.isEntityUri
  .spread getEntitiesItems(reqUserId)
  .then addUsersData(reqUserId)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

getEntitiesItems = (reqUserId)-> (uris, limit, offset)->
  promises_.all [
    getUserItems reqUserId, uris
    getNetworkItems reqUserId, uris
    items_.publicByEntities uris
  ]
  .spread (userItems, networkItems, publicItems)->
    # Only add user and network keys for the authorized endpoint
    if reqUserId?
      dedupPublicItems = deduplicateItems userItems, networkItems, publicItems
      return userItems.concat(networkItems).concat dedupPublicItems
    else
      return publicItems
  .then Paginate(limit, offset)

getUserItems = (reqUserId, uris)->
  unless reqUserId? then return []

  items_.byOwnersAndEntitiesAndListings [ reqUserId ], uris, 'user', reqUserId

getNetworkItems = (reqUserId, uris)->
  unless reqUserId? then return []

  relations_.getUserFriendsAndCoGroupsMembers reqUserId
  .then (networkUsersIds)->
    items_.byOwnersAndEntitiesAndListings networkUsersIds, uris, 'network', reqUserId

deduplicateItems = (userItems, networkItems, publicItems)->
  userAndNetworkItemsIds = userItems.map(getId).concat networkItems.map(getId)

  return publicItems
  .filter (item)-> item._id not in userAndNetworkItemsIds

getId = _.property '_id'
