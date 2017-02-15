__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ validateQuery, addUsersData, ownerIn } = require './lib/queries_commons'
filterPrivateAttributes = require './lib/filter_private_attributes'

module.exports = (req, res)->
  userId = req.user?._id
  validateQuery req.query, 'uris', _.isEntityUri
  .then getEntitiesItems(userId)
  .then addUsersData
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

getEntitiesItems = (userId)-> (uris)->
  promises_.all [
    getUserItems userId, uris
    getNetworkItems userId, uris
    items_.publicByEntities uris
  ]
  .spread (userItems, networkItems, publicItems)->
    # Only add user and network keys for the authorized endpoint
    if userId?
      return {
        user: userItems
        network: networkItems
        public: deduplicateItems userItems, networkItems, publicItems
      }
    else
      return { public: publicItems }

getUserItems = (userId, uris)->
  unless userId? then return []

  items_.byOwnersAndEntitiesAndListings [ userId ], uris, 'user', userId

getNetworkItems = (userId, uris)->
  unless userId? then return []

  relations_.getUserFriendsAndCoGroupsMembers userId
  .then (networkUsersIds)->
    items_.byOwnersAndEntitiesAndListings networkUsersIds, uris, 'network', userId

deduplicateItems = (userItems, networkItems, publicItems)->
  userAndNetworkItemsIds = userItems.map(getId).concat networkItems.map(getId)

  return publicItems
  .filter (item)-> item._id not in userAndNetworkItemsIds

getId = _.property '_id'
