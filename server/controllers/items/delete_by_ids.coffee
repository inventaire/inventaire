__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
sanitize = __.require 'lib', 'sanitize/sanitize'
radio = __.require 'lib', 'radio'

sanitization =
  ids: {}

module.exports = (req, res, next)->
  sanitize req, res, sanitization
  .then deleteByIds
  .then responses_.Ok(res)
  .catch error_.Handler(req, res)

deleteByIds = (params)->
  { ids, reqUserId } = params
  items_.byIds ids
  .then verifyOwnership(reqUserId)
  .then items_.bulkDelete
  .then -> radio.emit 'user:inventory:update', reqUserId

verifyOwnership = (reqUserId)-> (items)->
  for item in items
    if item.owner isnt reqUserId
      throw error_.new "user isn't item owner", 403, { reqUserId, itemId: item._id }
  return items
