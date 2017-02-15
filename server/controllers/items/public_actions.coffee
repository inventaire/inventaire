__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
couch_ = __.require 'lib', 'couch'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Item = __.require 'models', 'item'
{ Promise } = __.require 'lib', 'promises'
tests = __.require 'models', 'tests/common-tests'

module.exports =
  lastPublic: (req, res, next) ->
    { query } = req
    { limit, offset } = query
    assertImage = query['assert-image'] is 'true'
    reqUserId = req.user?._id

    limit or= '15'
    offset or= '0'

    try
      limit = _.stringToInt limit
    catch err
      return error_.bundle req, res, 'invalid limit', 400, [limit, err]

    try
      offset = _.stringToInt offset
    catch err
      return error_.bundle req, res, 'invalid offset', 400, [offset, err]

    if limit > 100
      return error_.bundle req, res, "limit can't be over 100", 400, limit

    items_.publicByDate limit, offset, assertImage, reqUserId
    .then bundleOwnersData.bind(null, req, res)
    .catch error_.Handler(req, res)

  byUsernameAndEntity: (req, res, next)->
    _.info req.query, 'publicByUserAndEntity'
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

bundleOwnersData = (req, res, items)->
  unless items?.length > 0
    return error_.bundle req, res, 'no item found', 404

  users = getItemsOwners items
  user_.getUsersPublicData users
  .then (users)-> res.json { items, users }

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq users

getAuthorizationLevel = (reqUserId, ownerId)->
  unless reqUserId? then return promises_.resolve 'public'

  if reqUserId is ownerId then return promises_.resolve 'user'

  user_.areFriendsOrGroupCoMembers reqUserId, ownerId
  .then (bool)-> if bool then 'network' else 'public'
