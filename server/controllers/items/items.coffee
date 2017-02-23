__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
couch_ = __.require 'lib', 'couch'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'

ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    'by-ids': require './by_ids'
    'by-users': require './by_users'
    'by-entities': require './by_entities'
    'last-public': require './last_public'
    'by-username-and-entity': require './by_username_and_entity'

  put: (req, res, next) ->
    { _id, title, entity } = req.body
    _.log req.body, "PUT item: #{_id}"
    unless _id? then return error_.bundle req, res, 'missing item id', 400
    unless title? then return error_.bundle req, res, 'missing item title', 400
    unless entity? then return error_.bundle req, res, 'missing item entity', 400

    reqUserId = req.user._id

    item = req.body
    itemId = item._id
    action = if itemId is 'new' then 'create' else 'update'

    actions[action].getCurrentItem(itemId)
    .then (currentItem)->
      items_[action](reqUserId, item)
      .then items_.byId.bind(null, itemId)
      .tap (updatedItem)->  radio.emit 'item:update', currentItem, updatedItem
    .then (item)-> res.status(201).json item
    .tap Track(req, ['item', actions[action].trackName])
    .catch error_.Handler(req, res)

  del: (req, res, next) ->
    { id } = req.query
    reqUserId = req.user._id

    items_.verifyOwnership id, reqUserId
    .then items_.delete.bind(null, id)
    # TODO: Update user snapshot.items:counter
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

actions =
  create:
    trackName: 'creation'
    getCurrentItem: (itemId)-> promises_.resolve null
  update:
    trackName: 'update'
    getCurrentItem: (itemId)-> items_.byId(itemId)
