__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next) ->
  unless req.user? then return error_.unauthorizedApiAccess req, res
  { body:item } = req

  { title, entity } = item

  _.log item, 'item create'

  unless title? then return error_.bundleMissingBody req, res, 'title'
  unless entity? then return error_.bundleMissingBody req, res, 'entity'

  reqUserId = req.user._id
  itemId = item._id

  items_.create reqUserId, item
  .then (item)-> res.status(201).json item
  .tap Track(req, ['item', 'creation'])
  .catch error_.Handler(req, res)
