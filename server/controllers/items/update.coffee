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
  { _id, title, entity } = item

  _.log item, 'item update'

  unless _id? then return error_.bundleMissingBody req, res, '_id'
  unless title? then return error_.bundleMissingBody req, res, 'title'
  unless entity? then return error_.bundleMissingBody req, res, 'entity'

  reqUserId = req.user._id
  itemId = item._id

  items_.update reqUserId, item
  .then res.json.bind(res)
  .tap Track(req, ['item', 'update'])
  .catch error_.Handler(req, res)
