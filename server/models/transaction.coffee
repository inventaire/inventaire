CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Transaction = {}

Transaction.tests = tests = require './tests/transaction'

Transaction.create = (userId, item)->
  itemId = item._id

  unless tests.userId(userId)
    throw error_.new "invalid userId: #{userId}", 400

  unless tests.itemId(itemId)
    throw error_.new "invalid itemId: #{itemId}", 400

  return transaction =
    item: itemId
    state: 'requested'
    requester: userId
    created: _.now()
