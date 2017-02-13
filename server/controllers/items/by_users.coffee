__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
doubleEndpoint = __.require 'lib', 'double_endpoint'

module.exports = doubleEndpoint (req, res, authentifiedUserId)->
  { users } = req.query

  unless _.isNonEmptyString users
    return error_.bundle req, res, 'missing users parameter', 400, req.query

  users = _.uniq users.split('|')

  for id in users
    unless _.isUserId id
      return error_.bundle req, res, 'invalid user id', 400, id

  # get relations to users
  getRelations users, authentifiedUserId
  .then fetchRelationsItems
  # Not including the associated users as this endpoint assumes
  # the requester already knows the users
  .then _.Wrap(res, 'items')
  .catch error_.Handler(req, res)

getRelations = (usersIds, authentifiedUserId)->
  # All users are considered public users when the request isn't authentified
  unless authentifiedUserId? then return promises_.resolve { public: usersIds }

  relations = {}
  if authentifiedUserId in usersIds
    relations.user = authentifiedUserId
    usersIds = _.without usersIds, authentifiedUserId

  if usersIds.length is 0 then return promises_.resolve relations

  user_.getRelationsStatuses authentifiedUserId, usersIds
  .spread (friends, coGroupMembers, publik)->
    relations.network = friends.concat coGroupMembers
    relations.public = publik
    return relations

fetchRelationsItems = (relations)->
  itemsPromises = {}
  { user, network, public:publik } = relations
  # Includes ownerSafe attributes
  if user? then itemsPromises.user = items_.byOwner user
  # Exclude ownerSafe attributes
  if network? then itemsPromises.network = items_.friendsListings network
  if publik? then itemsPromises.public = items_.publicListings publik

  return promises_.props itemsPromises
