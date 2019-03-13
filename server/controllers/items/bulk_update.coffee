__ = require('config').universalPath
_ = __.require 'builders', 'utils'
sanitize = __.require 'lib', 'sanitize/sanitize'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'

sanitization =
  ids: {}
  attribute: {}
  value: {}

module.exports = (req, res, next)->
  reqUserId = req.user._id

  sanitize req, res, sanitization
  .then (params)->
    { ids, attribute, value } = params
    items_.bulkUpdate(reqUserId, ids, attribute, value)
    .then responses_.Ok(res)
  .catch error_.Handler(req, res)
