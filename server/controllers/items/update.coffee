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
  { _id, entity } = item

  _.log item, 'item update'

  unless _id? then return error_.bundleMissingBody req, res, '_id'
  unless entity? then return error_.bundleMissingBody req, res, 'entity'

  unless _.isItemId _id
    return error_.bundleInvalid req, res, '_id', _id

  unless _.isEntityUri entity
    return error_.bundleInvalid req, res, 'entity', entity

  reqUserId = req.user._id
  itemId = item._id

  items_.update reqUserId, item
  .then res.json.bind(res)
  .tap Track(req, ['item', 'update'])
  .catch error_.Handler(req, res)
