__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
{ addAssociatedData, Paginate } = require './queries_commons'
getByAccessLevel = require './get_by_access_level'

module.exports = (page, usersIds)->
  # Allow to pass users ids either through the page object
  # or as an additional argument
  usersIds or= page.users
  { reqUserId } = page

  getRelations reqUserId, usersIds
  .then fetchRelationsItems(reqUserId)
  .then Paginate(page)
  .then addAssociatedData

getRelations = (reqUserId, usersIds)->
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
  itemsPromises = []
  { user, network, public:publik } = relations

  if user? then itemsPromises.push getByAccessLevel.private(user, reqUserId)
  if network? then itemsPromises.push getByAccessLevel.network(network, reqUserId)
  if publik? then itemsPromises.push getByAccessLevel.public(publik, reqUserId)

  return promises_.all(itemsPromises).then _.flatten
