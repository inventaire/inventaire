__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
sanitize = __.require 'lib', 'sanitize/sanitize'
{ Username } = __.require 'models', 'validations/regex'

sanitization =
  user: { optional: true }
  username: { optional: true }
  uri: {}
  limit: { optional: true }
  offset: { optional: true }

module.exports = (req, res)->
  { query } = req
  { uri } = query
  reqUserId = req.user?._id

  sanitize req, res, sanitization
  .then (input)-> getUser input, reqUserId
  .then getItemsFromUser(reqUserId, uri)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

getUser = (input, reqUserId)->
  { userId, username } = input
  if userId? then return user_.getUserById userId, reqUserId
  if username? then return user_.getUserFromUsername username, reqUserId
  return error_.rejectMissingQuery 'user|username'

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
