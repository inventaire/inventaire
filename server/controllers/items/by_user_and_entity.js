__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
sanitize = __.require 'lib', 'sanitize/sanitize'
{ Username } = __.require 'lib', 'regex'

sanitization =
  user: {}
  uri: {}
  limit: { optional: true }
  offset: { optional: true }

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { userId, uri, reqUserId } = params
    user_.getUserById userId, reqUserId
    .then getItemsFromUser(reqUserId, uri)
  .then responses_.Send(res)
  .catch error_.Handler(req, res)

getItemsFromUser = (reqUserId, uri)-> (user)->
  { _id:ownerId } = user
  getAuthorizationLevel reqUserId, ownerId
  .then (listingKey)->
    items_.byOwnersAndEntitiesAndListings [ ownerId ], [ uri ], listingKey, reqUserId
    .then (items)-> { users: [ user ], items }

getAuthorizationLevel = (reqUserId, ownerId)->
  unless reqUserId? then return promises_.resolve 'public'

  if reqUserId is ownerId then return promises_.resolve 'user'

  user_.areFriendsOrGroupCoMembers reqUserId, ownerId
  .then (bool)-> if bool then 'network' else 'public'
