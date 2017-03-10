__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models', 'tests/common-tests'

module.exports = (req, res)->
  { query } = req
  { uri } = query
  reqUserId = req.user?._id

  unless _.isEntityUri uri
    return error_.bundleInvalid req, res, 'uri', uri

  getUser query, reqUserId
  .then getItemsFromUser(reqUserId, uri)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

getUser = (query, reqUserId)->
  { user:userId, username } = query
  if userId?
    unless _.isUserId userId
      return error_.rejectInvalid 'user', userId

    return user_.getUserData userId, reqUserId

  else if username?
    unless tests.username username
      return error_.rejectInvalid 'username', userId

    return user_.getUserFromUsername username, reqUserId

  else
    return error_.rejectMissingQuery 'user|username'

getItemsFromUser = (reqUserId, uri)-> (user)->
  { _id:ownerId } = user
  getAuthorizationLevel reqUserId, ownerId
  .then (listingKey)->
    items_.byOwnersAndEntitiesAndListings [ownerId], [uri], listingKey, reqUserId
    .then (items)-> { users: [ user ], items }

getAuthorizationLevel = (reqUserId, ownerId)->
  unless reqUserId? then return promises_.resolve 'public'

  if reqUserId is ownerId then return promises_.resolve 'user'

  user_.areFriendsOrGroupCoMembers reqUserId, ownerId
  .then (bool)-> if bool then 'network' else 'public'
