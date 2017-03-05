__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next) ->
  unless req.user? then return error_.unauthorizedApiAccess req, res

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
    # Using the response id as in case of item creation itemId='new'
    .then (res)-> items_.byId res.id
    .tap (updatedItem)-> radio.emit 'item:update', currentItem, updatedItem
  .then (item)-> res.status(201).json item
  .tap Track(req, ['item', actions[action].trackName])
  .catch error_.Handler(req, res)

actions =
  create:
    trackName: 'creation'
    getCurrentItem: (itemId)-> promises_.resolve null
  update:
    trackName: 'update'
    getCurrentItem: (itemId)-> items_.byId(itemId)
