__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
sanitize = __.require 'lib', 'sanitize/sanitize'
{ addAssociatedData, listingIs, Paginate } = require './lib/queries_commons'
{ omitPrivateAttributes } = require './lib/filter_private_attributes'

sanitization =
  ids: {}
  limit: { optional: true }
  offset: { optional: true }
  'include-users':
    generic: 'boolean'
    default: false

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { ids, includeUsers, reqUserId } = params
    promises_.all [
      items_.byIds ids
      getNetworkIds reqUserId
    ]
    .spread filterAuthorizedItems(reqUserId)
    # Paginating isn't really required when requesting items by ids
    # but it also handles sorting and the consistency of the API
    .then Paginate(params)
    .then addAssociatedData
  .then responses_.Send(res)
  .catch error_.Handler(req, res)

getNetworkIds = (reqUserId)->
  if reqUserId? then return relations_.getUserFriendsAndCoGroupsMembers reqUserId
  else return []

filterAuthorizedItems = (reqUserId)-> (items, networkIds)->
  _.compact items
  .map filterByAuthorization(reqUserId, networkIds)
  # Keep non-nullified items
  .filter _.identity

filterByAuthorization = (reqUserId, networkIds)-> (item)->
  { owner:ownerId, listing } = item

  if ownerId is reqUserId then return item

  else if ownerId in networkIds
    # Filter-out private item for network users
    if listing isnt 'private' then return omitPrivateAttributes(item)

  else
    # Filter-out all non-public items for non-network users
    if listing is 'public' then return omitPrivateAttributes(item)
