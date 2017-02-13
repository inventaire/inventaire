__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
doubleEndpoint = __.require 'lib', 'double_endpoint'
{ validateQuery, addUsersData } = require './lib/queries_commons'

module.exports = doubleEndpoint (req, res, userId)->
  { uris } = req.query

  unless _.isNonEmptyString uris
    return error_.bundle req, res, 'missing uris parameter', 400, req.query

  uris = _.uniq uris.split('|')

  for uri in uris
    unless _.isEntityUri uri
      return error_.bundle req, res, 'invalid uri', 400, uri

  # fetch all items from those entities
  promises_.all [
    getUserItems userId, uris
    getNetworkItems userId, uris
    items_.publicByEntities uris
  ]
  .spread (userItems, networkItems, publicItems)->
    items = { public: publicItems }
    # Only add user and network keys for the authorized endpoint
    if userId?
      items.user = userItems
      items.network = networkItems
    return items

  .then addUsersData
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

getUserItems = (userId, uris)->
  unless userId? then return []

  # Fetch all items from the requesting user
  items_.byOwner userId
  # Filter to keep only those from the requested entity
  .then (items)-> items.filter (item)-> item.entity in uris

getNetworkItems = (userId, uris)->
  unless userId? then return []

  promises_.all [
    # Fetch all items from those entities requiring an authorization
    items_.authorizedByEntities uris
    relations_.getUserFriendsAndCoGroupsMembers userId
  ]
  .spread (authorizedItems, networkUsersIds)->
    # Keep only items the user is authorized to see,
    # which are items from users in her network
    return authorizedItems.filter (item)-> item.owner in networkUsersIds
