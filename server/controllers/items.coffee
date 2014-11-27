__ = require('config').root
_ = __.require 'builders', 'utils'
inv_ = __.require 'lib', 'inv'
user_ = __.require 'lib', 'user'

module.exports =
  fetch: (req, res, next) ->
    # only fetch for session email
    # = only way to fetch private data on items
    user_.getUserId(req.session.email)
    .then inv_.byOwner.bind(inv_)
    .then (items)-> res.json items
    .catch (err)-> _.errorHandler res, err
    .done()

  put: (req, res, next) ->
    _.log req.params.id, 'Put Item ID'
    user_.getUserId(req.session.email)
    .done (userId)->
      item = req.body
      item.owner = userId
      if inv_.isValidItem item
        inv_.db.put item
        .then (body)-> _.getObjIfSuccess inv_.db, body
        .then (body)-> res.json 201, body
        .catch (err)-> _.errorHandler res, err
        .done()
      else
        _.errorHandler res, "couldn't add this item", 400

  # not used
  # get: (req, res, next) ->
  #   _.log req.params.id, 'GET Item ID'
  #   inv_.get req.params.id
  #   .then (body)-> res.json(body)
  #   .catch (err)-> _.errorHandler res, err
  #   .done()

  del: (req, res, next) ->
    # missing req.session.email check isn't it?
    _.info req.params, 'del'
    inv_.db.delete req.params.id, req.params.rev
    .then (body)-> res.json(body)
    .catch (err)-> _.errorHandler res, err
    .done()

  publicByEntity: (req, res, next) ->
    _.info req.params, 'public'
    inv_.byEntity(req.params.uri)
    .then bundleOwnersData.bind(null, res)

  fetchLastPublicItems: (req, res, next) ->
    inv_.publicByDate()
    .then bundleOwnersData.bind(null, res)

  publicByUserAndSuffix: (req, res, next)->
    _.info req.params, 'publicByUserAndSuffix'
    user_.getSafeUserFromUsername(req.params.username)
    .then (user)->
      if user?._id?
        owner = user._id
        inv_.publicByOwnerAndSuffix(owner, req.params.suffix)
        .then (items)->
          return res.json {items: items, user: user}
      else _.errorHandler res, 'user not found', 404
    .catch (err)-> _.errorHandler res, err
    .done()

bundleOwnersData = (res, items)->
  _.success items, 'items'
  users = getItemsOwners(items)
  user_.getUsersPublicData(users)
  .then (users)-> res.json {items: items, users: users}
  .catch (err)-> _.errorHandler res, err

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq(users)