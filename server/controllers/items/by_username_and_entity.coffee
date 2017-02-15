__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models', 'tests/common-tests'

module.exports = (req, res)->
  { username, uri } = req.query
  reqUserId = req.user?._id

  unless tests.entityUri uri
    return error_.bundle req, res, 'bad entity uri', 400, uri
  unless tests.username username
    return error_.bundle req, res, 'bad username', 400, username

  user_.getSafeUserFromUsername username
  .then (user)->
    { _id } = user
    unless _id?
      return error_.new 'user not found', 404

    ownerId = _id

    getAuthorizationLevel reqUserId, ownerId
    .then (listingKey)->
      items_.byOwnersAndEntitiesAndListings [ownerId], [uri], listingKey, reqUserId
      .then (foundItems)->
        items = {}
        items[listingKey] = foundItems
        res.json { users: [ user ], items }

  .catch error_.Handler(req, res)

getAuthorizationLevel = (reqUserId, ownerId)->
  unless reqUserId? then return promises_.resolve 'public'

  if reqUserId is ownerId then return promises_.resolve 'user'

  user_.areFriendsOrGroupCoMembers reqUserId, ownerId
  .then (bool)-> if bool then 'network' else 'public'
