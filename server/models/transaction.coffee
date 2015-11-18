CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ findNextActions } = __.require('sharedLibs', 'transactions')(_)

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
    read:
      requester: true
      owner: false

requestable = [
  'giving'
  'lending'
  'selling'
]

Transaction.testPossibleState = (transaction, newState)->
  unless newState in states[transaction.state].next
    throw error_.new "invalid state update", 400, transaction, newState

  if newState is 'returned' and transaction.transaction isnt 'lending'
    throw error_.new "transaction and state mismatch", 400, transaction, newState

Transaction.states = states =
  requested:
    actor: 'requester'
    next: ['accepted', 'declined']
  accepted:
    actor: 'owner'
    next: ['confirmed']
  declined:
    actor: 'owner'
    next: []
  confirmed:
    actor: 'requester'
    next: ['returned']
  returned:
    actor: 'owner'
    next: []

Transaction.statesList = Object.keys states

# do the item change of owner or return to its previous owner
Transaction.isOneWay = (transacDoc)->
  unless _.isString transacDoc.transaction
    throw error_.new "transaction transaction inaccessible", 500, transacDoc
  oneWay[transacDoc.transaction]

oneWay =
  giving: true
  lending: false
  selling: true

Transaction.isActive = (transacDoc)->
  findNextActions
    name: transacDoc.transaction
    state: transacDoc.state
    # owner doesnt matter to find if the transaction is active
    # thus we just pass an arbitrary boolean
    mainUserIsOwner: true
