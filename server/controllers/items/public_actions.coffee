__ = require('config').root
_ = __.require 'builders', 'utils'
items_ = __.require 'lib', 'items'
user_ = __.require 'lib', 'user/user'
couch_ = require 'inv-couch'
error_ = __.require 'lib', 'error/error'
Item = __.require 'models', 'item'
Promise = require 'bluebird'
tests = __.require 'models', 'tests/common-tests'

module.exports =
  lastPublicItems: (req, res, next) ->
    items_.publicByDate 15
    .then bundleOwnersData.bind(null, res)
    .catch error_.Handler(res)

  usersPublicItems: (req, res, next)->
    _.info req.query, 'usersPublicItems'
    { query } = req
    { users } = query
    unless _.isNonEmptyString(users)
      return error_.bundle res, 'missing parameter: users', 400, query

    usersIds = users.split '|'
    unless _.all usersIds, tests.userId
      return error_.bundle res, 'invalid user ids', 400, query

    items_.bundleListings ['public'], usersIds
    .then (items)-> { items: items }
    .then res.json.bind(res)
    .catch error_.Handler(res)

  publicById: (req, res, next) ->
    {id} = req.query
    unless tests.itemId id
      return error_.bundle res, 'bad item id', 400

    items_.publicById id
    .then res.json.bind(res)
    .catch error_.Handler(res)

  publicByEntity: (req, res, next) ->
    _.info req.query, 'publicByEntity'
    {uri} = req.query
    unless tests.entityUri uri
      return error_.bundle res, 'bad entity uri', 400

    items_.publicByEntity uri
    .then bundleOwnersData.bind(null, res)
    .catch error_.Handler(res)

  publicByUsernameAndEntity: (req, res, next)->
    _.info req.query, 'publicByUserAndEntity'
    {username, uri} = req.query

    unless tests.entityUri uri
      return error_.bundle res, 'bad entity uri', 400
    unless tests.username username
      return error_.bundle res, 'bad username', 400

    user_.getSafeUserFromUsername username
    .then (user)->
      {_id} = user
      unless _id?
        return error_.new 'user not found', 404

      owner = _id
      items_.publicByOwnerAndEntity owner, uri
      .then (items)-> res.json {items: items, user: user}

    .catch error_.Handler(res)

bundleOwnersData = (res, items)->
  unless items?.length > 0
    return error_.bundle res, 'no item found', 404

  users = getItemsOwners items
  user_.getUsersPublicData users
  .then (users)-> res.json {items: items, users: users}

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq users
