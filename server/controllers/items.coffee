__ = require('config').root
_ = __.require 'builders', 'utils'
items_ = __.require 'lib', 'items'
user_ = __.require 'lib', 'user'
Item = __.require 'models', 'item'
Promise = require 'bluebird'

module.exports =
  fetch: (req, res, next) ->
    # only fetch for session email
    # = only way to fetch private data on items
    user_.getUserId(req.session.email)
    .then items_.byOwner.bind(items_)
    .then (items)-> res.json items
    .catch (err)-> _.errorHandler res, err

  put: (req, res, next) ->
    _.log req.params.id, 'Put Item ID'
    user_.getUserId(req.session.email)
    .then (userId)->
      item = req.body
      if item._id is 'new' then Item.create(userId, item)
      else Item.update(userId, item)
    .then (body)-> _.getObjIfSuccess items_.db, body
    .then (body)-> res.status(201).json body
    .catch (err)-> _.errorHandler res, err

  del: (req, res, next) ->
    _.info req.params, 'del'
    {id, rev} = req.params
    getUserIdAndItem(req, id)
    .spread (userId, item)->
      if userId is item?.owner
        _.log id, 'deleting!'
        items_.db.delete(id, rev)
        .then (body)-> res.json(body)
      else
        err = "user isnt item.owner: #{userId} / #{item.owner}"
        _.errorHandler res, err, 403
    .catch (err)-> _.errorHandler res, err

  publicByEntity: (req, res, next) ->
    _.info req.params, 'public'
    items_.byEntity(req.params.uri)
    .then bundleOwnersData.bind(null, res)
    .catch (err)-> _.errorHandler res, err

  fetchLastPublicItems: (req, res, next) ->
    items_.publicByDate()
    .then bundleOwnersData.bind(null, res)
    .catch (err)-> _.errorHandler res, err

  publicByUserAndSuffix: (req, res, next)->
    _.info req.params, 'publicByUserAndSuffix'
    user_.getSafeUserFromUsername(req.params.username)
    .then (user)->
      if user?._id?
        owner = user._id
        items_.publicByOwnerAndSuffix(owner, req.params.suffix)
        .then (items)->
          return res.json {items: items, user: user}
      else _.errorHandler res, 'user not found', 404
    .catch (err)-> _.errorHandler res, err

bundleOwnersData = (res, items)->
  unless items?.length > 0 then return _.errorHandler res, 'no item found', 404
  else
    users = getItemsOwners(items)
    user_.getUsersPublicData(users)
    .then (users)-> res.json {items: items, users: users}

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq(users)


getUserIdAndItem = (req, itemId)->
  return Promise.all [
    user_.getUserId(req.session.email)
    items_.db.get(itemId)
  ]

