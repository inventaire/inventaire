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

  unless item.transaction in requestable
    throw error_.new "this item can't be requested", 400, requester, item

  return transaction =
    item: itemId
    transaction: item.transaction
    state: 'requested'
    owner: owner
    requester: requester
    created: now = _.now()
    actions: [ { action: 'requested', timestamp: now } ]

requestable = [
  'giving'
  'lending'
  'selling'
]

Transaction.testPossibleState = (transaction, newState)->
  unless newState in possibleNextState[transaction.state]
    throw error_.new "invalid state update", 400, transaction, newState

  if newState is 'returned' and transaction.transaction isnt 'lending'
    throw error_.new "transaction and state mismatch", 400, transaction, newState


possibleNextState =
  requested: ['accepted', 'declined']
  accepted: ['confirmed']
  declined: []
  confirmed: ['returned']
  returned: []
