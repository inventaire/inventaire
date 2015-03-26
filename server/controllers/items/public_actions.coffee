__ = require('config').root
_ = __.require 'builders', 'utils'
items_ = __.require 'lib', 'items'
user_ = __.require 'lib', 'user/user'
couch_ = __.require 'lib', 'couch'
error_ = __.require 'lib', 'error/error'
Item = __.require 'models', 'item'
Promise = require 'bluebird'

module.exports =
  lastPublicItems: (req, res, next) ->
    items_.publicByDate()
    .then (res)-> _.log res, 'fetchLastPublicItems'
    .then bundleOwnersData.bind(null, res)
    .catch error_.Handler(res)

  publicByEntity: (req, res, next) ->
    _.info req.query, 'publicByEntity'
    {uri} = req.query
    items_.publicByEntity(uri)
    .then bundleOwnersData.bind(null, res)
    .catch error_.Handler(res)

  publicByUsernameAndEntity: (req, res, next)->
    _.info req.query, 'publicByUserAndEntity'
    {username, uri} = req.query
    _.types [username, uri], 'strings...'
    user_.getSafeUserFromUsername(username)
    .then (user)->
      {_id} = user
      unless _id?
        return error_.new 'user not found', 404

      owner = _id
      items_.publicByOwnerAndEntity(owner, uri)
      .then (items)-> res.json {items: items, user: user}

    .catch error_.Handler(res)

bundleOwnersData = (res, items)->
  unless items?.length > 0
    return error_.bundle res, 'no item found', 404

  users = getItemsOwners(items)
  user_.getUsersPublicData(users)
  .then (users)-> res.json {items: items, users: users}

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq(users)
