CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Transaction = {}

Transaction.tests = tests = require './tests/transaction'

Transaction.create = (userId, item)->
  itemId = item._id

  tests.pass 'userId', userId
  tests.pass 'itemId', itemId

  return transaction =
    item: itemId
    state: 'requested'
    requester: userId
    created: _.now()
