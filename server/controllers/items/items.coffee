__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'lib', 'user/user'
couch_ = __.require 'lib', 'couch'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ Track } = __.require 'lib', 'track'

publicActions = require './public_actions'
byIds = require './by_ids'
byUsers = require './by_users'
byEntities = require './by_entities'
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    'by-ids': byIds
    'by-users': byUsers
    'by-entities': byEntities
    'last-public': publicActions.lastPublic
    'by-username-and-entity': publicActions.byUsernameAndEntity

  put: (req, res, next) ->
    { _id, title, entity } = req.body
    _.log req.body, "PUT item: #{_id}"
    unless _id? then return error_.bundle req, res, 'missing item id', 400
    unless title? then return error_.bundle req, res, 'missing item title', 400
    unless entity? then return error_.bundle req, res, 'missing item entity', 400

    reqUserId = req.user._id

    promises_.try ->
      item = req.body
      if item._id is 'new'
        items_.create reqUserId, item
        .tap Track(req, ['item', 'creation'])
      else
        items_.update reqUserId, item
        .tap Track(req, ['item', 'update'])
    .then couch_.getObjIfSuccess.bind(null, items_.db)
    # TODO: Update user snapshot.items:counter
    .then (body)-> res.status(201).json body
    .catch error_.Handler(req, res)

  del: (req, res, next) ->
    { id } = req.query
    reqUserId = req.user._id

    items_.verifyOwnership id, reqUserId
    .then items_.delete.bind(null, id)
    # TODO: Update user snapshot.items:counter
    .then res.json.bind(res)
    .catch error_.Handler(req, res)
