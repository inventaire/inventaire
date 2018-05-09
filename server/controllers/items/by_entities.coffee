__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
sanitize = __.require 'lib', 'sanitize/sanitize'
responses_ = __.require 'lib', 'responses'
{ addAssociatedData, Paginate } = require './lib/queries_commons'
{ filterPrivateAttributes } = require './lib/filter_private_attributes'

sanitization =
  uris: {}
  limit: { optional: true }
  offset: { optional: true }

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then getEntitiesItems
  .then addAssociatedData
  .then responses_.Send(res)
  .catch error_.Handler(req, res)

getEntitiesItems = (page)->
  { uris, reqUserId } = page

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
  .then Paginate(page)

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
