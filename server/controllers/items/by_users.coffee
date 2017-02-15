__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ validateQuery } = require './lib/queries_commons'

module.exports = (req, res)->
  reqUserId = req.user?._id
  validateQuery req.query, 'users', _.isUserId
  .then getRelations(reqUserId)
  .then fetchRelationsItems(reqUserId)
  # Not including the associated users as this endpoint assumes
  # the requester already knows the users
  .then _.Wrap(res, 'items')
  .catch error_.Handler(req, res)

getRelations = (reqUserId)-> (usersIds)->
  # All users are considered public users when the request isn't authentified
  unless reqUserId? then return promises_.resolve { public: usersIds }

  relations = {}
  if reqUserId in usersIds
    relations.user = reqUserId
    usersIds = _.without usersIds, reqUserId

  if usersIds.length is 0 then return promises_.resolve relations

  user_.getRelationsStatuses reqUserId, usersIds
  .spread (friends, coGroupMembers, publik)->
    relations.network = friends.concat coGroupMembers
    relations.public = publik
    return relations

fetchRelationsItems = (reqUserId)-> (relations)->
  itemsPromises = {}
  { user, network, public:publik } = relations
  # Includes ownerSafe attributes
  if user? then itemsPromises.user = items_.byOwner user
  # Exclude ownerSafe attributes
  if network?
    itemsPromises.network = items_.friendsListings network, reqUserId
  if publik?
    itemsPromises.public = items_.publicListings publik, reqUserId

  return promises_.props itemsPromises
