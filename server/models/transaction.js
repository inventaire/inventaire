// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Transaction, validations
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const snapshotItemAttributes = require('./attributes/item').snapshot
const snapshotUserAttributes = require('./attributes/user').snapshot
const { states, basicNextActions, nextActionsWithReturn } = require('./attributes/transaction')

module.exports = (Transaction = {})

Transaction.validations = (validations = require('./validations/transaction'))

Transaction.create = (itemDoc, ownerDoc, requesterDoc) => {
  const itemId = itemDoc._id
  const ownerId = ownerDoc._id
  const requesterId = requesterDoc._id

  validations.pass('itemId', itemId)
  validations.pass('userId', ownerId)
  validations.pass('userId', requesterId)

  if (!requestable.includes(itemDoc.transaction)) {
    throw error_.new("this item can't be requested", 400, itemDoc)
  }

  const now = Date.now()

  return {
    item: itemId,
    owner: ownerId,
    requester: requesterId,
    transaction: itemDoc.transaction,
    state: 'requested',
    created: now,
    actions: [ { action: 'requested', timestamp: now } ],
    read: {
      requester: true,
      owner: false
    },
    // keeping a copy of basic data to provide for when those
    // will not be accessible anymore
    // ex: item visibility change, deleted user, etc.
    snapshot: snapshotData(itemDoc, ownerDoc, requesterDoc)
  }
}

const requestable = [
  'giving',
  'lending',
  'selling'
]

Transaction.validatePossibleState = (transaction, newState) => {
  if (!states[transaction.state].next.includes(newState)) {
    throw error_.new('invalid state update', 400, transaction, newState)
  }

  if ((newState === 'returned') && (transaction.transaction !== 'lending')) {
    throw error_.new('transaction and state mismatch', 400, transaction, newState)
  }
}

// do the item change of owner or return to its previous owner
Transaction.isOneWay = transacDoc => {
  if (!_.isString(transacDoc.transaction)) {
    throw error_.new('transaction transaction inaccessible', 500, transacDoc)
  }
  return oneWay[transacDoc.transaction]
}

const oneWay = {
  giving: true,
  lending: false,
  selling: true
}

Transaction.isActive = transacDoc => {
  const transacData = {
    name: transacDoc.transaction,
    state: transacDoc.state,
    // owner doesnt matter to find if the transaction is active
    // thus we just pass an arbitrary boolean
    mainUserIsOwner: true
  }
  // if there are next actions, the transaction is active
  return (findNextActions(transacData) != null)
}

const snapshotData = (itemDoc, ownerDoc, requesterDoc) => ({
  item: _.pick(itemDoc, snapshotItemAttributes),
  entity: getEntitySnapshotFromItemSnapshot(itemDoc.snapshot),
  owner: _.pick(ownerDoc, snapshotUserAttributes),
  requester: _.pick(requesterDoc, snapshotUserAttributes)
})

const getEntitySnapshotFromItemSnapshot = itemSnapshot => {
  const entitySnapshot = {}
  if (itemSnapshot['entity:title'] != null) { entitySnapshot.title = itemSnapshot['entity:title'] }
  if (itemSnapshot['entity:image'] != null) { entitySnapshot.image = itemSnapshot['entity:image'] }
  if (itemSnapshot['entity:authors'] != null) { entitySnapshot.authors = itemSnapshot['entity:authors'] }
  return entitySnapshot
}

const getNextActionsList = transactionName => {
  if (transactionName === 'lending') {
    return nextActionsWithReturn
  } else {
    return basicNextActions
  }
}

const findNextActions = transacData => {
  const { name, state, mainUserIsOwner } = transacData
  const nextActions = getNextActionsList(name, state)
  const role = mainUserIsOwner ? 'owner' : 'requester'
  return nextActions[state][role]
}
