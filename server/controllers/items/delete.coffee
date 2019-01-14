__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'

module.exports = (req, res, next)->
  { id } = req.query
  reqUserId = req.user._id

  items_.verifyOwnership id, reqUserId
  .then items_.delete.bind(null, id)
  .then responses_.Send(res)
  .catch error_.Handler(req, res)
