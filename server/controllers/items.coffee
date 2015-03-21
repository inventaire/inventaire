__ = require('config').root
_ = __.require 'builders', 'utils'
items_ = __.require 'lib', 'items'
user_ = __.require 'lib', 'user/user'
couch_ = __.require 'lib', 'couch'
error_ = __.require 'lib', 'error/error'
Item = __.require 'models', 'item'
Promise = require 'bluebird'

module.exports =
  fetch: (req, res, next) ->
    # only fetch for session email
    # = only way to fetch private data on items
    user_.getUserId(req)
    .then items_.byOwner.bind(items_)
    .then res.json.bind(res)
    .catch error_.Handler(res)

  put: (req, res, next) ->
    _.log req.params.id, 'Put Item ID'
    user_.getUserId(req)
    .then (userId)->
      item = req.body
      if item._id is 'new' then Item.create(userId, item)
      else Item.update(userId, item)
    .then couch_.getObjIfSuccess.bind(null, items_.db)
    .then (body)-> res.status(201).json body
    .catch error_.Handler(res)

  del: (req, res, next) ->
    _.info req.params, 'del'
    {id, rev} = req.params
    getUserIdAndItem(req, id)
    .spread (userId, item)->
      unless userId is item?.owner
        throw error_.new 'user isnt item.owner', 403, userId, item.owner
      _.log id, 'deleting!'
      items_.db.delete(id, rev)
      .then res.json.bind(res)
    .catch error_.Handler(res)

  publicByEntity: (req, res, next) ->
    _.info req.params, 'public'
    items_.publicByEntity(req.params.uri)
    .then bundleOwnersData.bind(null, res)
    .catch error_.Handler(res)

  fetchLastPublicItems: (req, res, next) ->
    items_.publicByDate()
    .then bundleOwnersData.bind(null, res)
    .catch error_.Handler(res)

  publicByUserAndSuffix: (req, res, next)->
    _.info req.params, 'publicByUserAndSuffix'
    user_.getSafeUserFromUsername(req.params.username)
    .then (user)->
      {_id} = user
      unless _id?
        return error_.new 'user not found', 404

      owner = _id
      items_.publicByOwnerAndSuffix(owner, req.params.suffix)
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


getUserIdAndItem = (req, itemId)->
  return Promise.all [
    user_.getUserId(req)
    items_.db.get(itemId)
  ]

