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
  unless _id? then return error_.bundleMissingBody req, res, 'item'
  unless title? then return error_.bundleMissingBody req, res, 'title'
  unless entity? then return error_.bundleMissingBody req, res, 'entity'

  reqUserId = req.user._id

  item = req.body
  itemId = item._id
  action = if itemId is 'new' then 'create' else 'update'

  items_[action](reqUserId, item)
  .then (item)-> res.status(201).json item
  .tap Track(req, ['item', trackNames[action]])
  .catch error_.Handler(req, res)

trackNames =
  create: 'creation'
  update: 'update'
