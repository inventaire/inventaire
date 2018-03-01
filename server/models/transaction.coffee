CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ findNextActions } = __.require('sharedLibs', 'transactions')(_)
snapshotItemAttributes = __.require('models', 'attributes/item').snapshot
snapshotUserAttributes = __.require('models', 'attributes/user').snapshot

module.exports = Transaction = {}

Transaction.tests = tests = require './tests/transaction'

Transaction.create = (itemDoc, ownerDoc, requesterDoc)->
  itemId = itemDoc._id
  ownerId = ownerDoc._id
  requesterId = requesterDoc._id

  tests.pass 'itemId', itemId
  tests.pass 'userId', ownerId
  tests.pass 'userId', requesterId

  unless itemDoc.transaction in requestable
    throw error_.new "this item can't be requested", 400, itemDoc

  now = Date.now()

  return transaction =
    item: itemId
    owner: ownerId
    requester: requesterId
    transaction: itemDoc.transaction
    state: 'requested'
    created: now
    actions: [ { action: 'requested', timestamp: now } ]
    read:
      requester: true
      owner: false
    # keeping a copy of basic data to provide for when those
    # will not be accessible anymore
    # ex: item visibility change, deleted user, etc.
    snapshot: snapshotData itemDoc, ownerDoc, requesterDoc

requestable = [
  'giving'
  'lending'
  'selling'
]

Transaction.testPossibleState = (transaction, newState)->
  unless newState in states[transaction.state].next
    throw error_.new 'invalid state update', 400, transaction, newState

  if newState is 'returned' and transaction.transaction isnt 'lending'
    throw error_.new 'transaction and state mismatch', 400, transaction, newState

# actor: the key on which VerifyRights switches
# see controllers/transactions/update_state.coffee
Transaction.states = states =
  requested:
    # current action actor
    actor: 'requester'
    # next actions: the actor(s) may defer from the current one
    next: ['accepted', 'declined', 'cancelled']
  accepted:
    actor: 'owner'
    next: ['confirmed', 'cancelled']
  declined:
    actor: 'owner'
    next: []
  confirmed:
    actor: 'requester'
    next: ['returned', 'cancelled']
  returned:
    actor: 'owner'
    next: []
  cancelled:
    actor: 'both'
    next: []

Transaction.statesList = Object.keys states

# do the item change of owner or return to its previous owner
Transaction.isOneWay = (transacDoc)->
  unless _.isString transacDoc.transaction
    throw error_.new 'transaction transaction inaccessible', 500, transacDoc
  oneWay[transacDoc.transaction]

oneWay =
  giving: true
  lending: false
  selling: true

Transaction.isActive = (transacDoc)->
  # if there are next actions, the transaction is active
  findNextActions
    name: transacDoc.transaction
    state: transacDoc.state
    # owner doesnt matter to find if the transaction is active
    # thus we just pass an arbitrary boolean
    mainUserIsOwner: true

snapshotData = (itemDoc, ownerDoc, requesterDoc)->
  item: _.pick itemDoc, snapshotItemAttributes
  entity: getEntitySnapshotFromItemSnapshot itemDoc.snapshot
  owner: _.pick ownerDoc, snapshotUserAttributes
  requester: _.pick requesterDoc, snapshotUserAttributes

getEntitySnapshotFromItemSnapshot = (itemSnapshot)->
  entitySnapshot = {}
  for k, v of itemSnapshot
    # Ex: keep only 'image' in the key 'entity:image'
    key = k.split(':')[1]
    entitySnapshot[key] = v
  return entitySnapshot
