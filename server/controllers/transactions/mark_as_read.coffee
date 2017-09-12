# mark the whole transaction as read

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models','tests/common'
transactions_ = require './lib/transactions'

module.exports = (req, res, next)->
  { id } = req.body
  tests.pass 'transactionId', id
  reqUserId = req.user._id

  transactions_.byId id
  .then transactions_.verifyRightToInteract.bind(null, reqUserId)
  .then transactions_.markAsRead.bind(null, reqUserId)
  .then _.Ok(res)
  .catch error_.Handler(req, res)
