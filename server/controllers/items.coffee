__ = require('config').root
_ = __.require 'builders', 'utils'
items_ = __.require 'lib', 'items'
user_ = __.require 'lib', 'user'
Item = __.require 'models', 'item'

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
      try item = Item.validate(item, userId)
      catch err
        _.error {item: item, error: err.stack.split('\n')}, 'invalid item'
        return _.errorHandler res, "invalid item: #{err}", 400

      items_.db.put item
      .then (body)-> _.getObjIfSuccess items_.db, body
      .then (body)-> res.json 201, body
      .catch (err)-> _.errorHandler res, err

  del: (req, res, next) ->
    # missing req.session.email check isn't it?
    _.info req.params, 'del'
    items_.db.delete req.params.id, req.params.rev
    .then (body)-> res.json(body)
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