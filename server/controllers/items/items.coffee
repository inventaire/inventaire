__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
couch_ = __.require 'lib', 'couch'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ Track } = __.require 'lib', 'track'

publicActions = require './public_actions'
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  fetch: (req, res, next) ->
    # only fetch for requesters session
    # = only way to fetch private data on items
    userId = req.user._id

    items_.byOwner userId
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  put: (req, res, next) ->
    { _id, title, entity } = req.body
    _.log req.body, "PUT item: #{_id}"
    unless _id? then return error_.bundle req, res, 'missing item id', 400
    unless title? then return error_.bundle req, res, 'missing item title', 400
    unless entity? then return error_.bundle req, res, 'missing item entity', 400

    userId = req.user._id

    promises_.try ->
      item = req.body
      if item._id is 'new'
        items_.create userId, item
        .tap Track(req, ['item', 'creation'])
      else
        items_.update userId, item
        .tap Track(req, ['item', 'update'])
    .then couch_.getObjIfSuccess.bind(null, items_.db)
    .then (body)-> res.status(201).json body
    .catch error_.Handler(req, res)

  del: (req, res, next) ->
    { id } = req.query
    userId = req.user._id

    items_.verifyOwnership id, userId
    .then items_.delete.bind(null, id)
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  publicActions: ActionsControllers
    'public-by-id': publicActions.publicById
    'public-by-entity': publicActions.publicByEntity
    'public-by-username-and-entity': publicActions.publicByUsernameAndEntity
    'last-public-items': publicActions.lastPublicItems
    'users-public-items': publicActions.usersPublicItems
