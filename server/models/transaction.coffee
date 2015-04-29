CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Transaction = {}

Transaction.tests = tests = require './tests/transaction'

Transaction.create = (requester, item)->
  itemId = item._id
  owner = item.owner

  tests.pass 'userId', requester
  tests.pass 'userId', owner
  tests.pass 'itemId', itemId

  return transaction =
    item: itemId
    state: 'requested'
    owner: owner
    requester: requester
    created: _.now()
