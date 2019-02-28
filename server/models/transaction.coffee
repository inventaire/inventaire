CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
snapshotItemAttributes = require('./attributes/item').snapshot
snapshotUserAttributes = require('./attributes/user').snapshot
{ states, basicNextActions, nextActionsWithReturn } = require './attributes/transaction'

module.exports = Transaction = {}

Transaction.validations = validations = require './validations/transaction'

Transaction.create = (itemDoc, ownerDoc, requesterDoc)->
  itemId = itemDoc._id
  ownerId = ownerDoc._id
  requesterId = requesterDoc._id

  validations.pass 'itemId', itemId
  validations.pass 'userId', ownerId
  validations.pass 'userId', requesterId

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

Transaction.validatePossibleState = (transaction, newState)->
  unless newState in states[transaction.state].next
    throw error_.new 'invalid state update', 400, transaction, newState

  if newState is 'returned' and transaction.transaction isnt 'lending'
    throw error_.new 'transaction and state mismatch', 400, transaction, newState

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
  transacData =
    name: transacDoc.transaction
    state: transacDoc.state
    # owner doesnt matter to find if the transaction is active
    # thus we just pass an arbitrary boolean
    mainUserIsOwner: true
  # if there are next actions, the transaction is active
  return findNextActions(transacData)?

snapshotData = (itemDoc, ownerDoc, requesterDoc)->
  item: _.pick itemDoc, snapshotItemAttributes
  entity: getEntitySnapshotFromItemSnapshot itemDoc.snapshot
  owner: _.pick ownerDoc, snapshotUserAttributes
  requester: _.pick requesterDoc, snapshotUserAttributes

getEntitySnapshotFromItemSnapshot = (itemSnapshot)->
  entitySnapshot = {}
  if itemSnapshot['entity:image']? then entitySnapshot.image = itemSnapshot['entity:image']
  if itemSnapshot['entity:authors']? then entitySnapshot.authors = itemSnapshot['entity:authors']
  return entitySnapshot

getNextActionsList = (transactionName)->
  if transactionName is 'lending' then nextActionsWithReturn
  else basicNextActions

findNextActions = (transacData)->
  { name, state, mainUserIsOwner } = transacData
  nextActions = getNextActionsList name, state
  role = if mainUserIsOwner then 'owner' else 'requester'
  return nextActions[state][role]
