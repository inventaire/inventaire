// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Transaction = __.require('models', 'transaction')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')
const comments_ = __.require('controllers', 'comments/lib/comments')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const { minKey, maxKey } = __.require('lib', 'couch')
const assert_ = __.require('utils', 'assert_types')

const radio = __.require('lib', 'radio')

const db = __.require('couch', 'base')('transactions')

const transactions_ = {
  db,
  byId: db.get,
  byUser: userId => {
    return db.viewCustom('byUserAndItem', {
      // get all the docs with this userId
      startkey: [ userId, minKey ],
      endkey: [ userId, maxKey ],
      include_docs: true
    })

  },

  byUserAndItem: (userId, itemId) => {
    assert_.strings([ userId, itemId ])
    return db.viewByKey('byUserAndItem', [ userId, itemId ])
  },

  create: (itemDoc, ownerDoc, requesterDoc) => {
    const transaction = Transaction.create(itemDoc, ownerDoc, requesterDoc)
    _.log(transaction, 'transaction')
    return db.post(transaction)
    .then(couchRes => {
      radio.emit('transaction:request', couchRes.id)
      return couchRes
    })
  },

  addMessage: (userId, message, transactionId) => {
    assert_.strings([ userId, message, transactionId ])
    if (message != null) {
      return comments_.addTransactionComment(userId, message, transactionId)
    }
  },

  updateState: (newState, userId, transaction) => {
    Transaction.validatePossibleState(transaction, newState)
    return db.update(transaction._id, stateUpdater(newState, userId, transaction))
    .then(() => radio.emit('transaction:update', transaction, newState))
  },

  markAsRead: (userId, transaction) => {
    const role = userRole(userId, transaction)
    // not handling cases when both user are connected:
    // should be clarified once sockets/server events will be implemented
    return db.update(transaction._id, BasicUpdater(`read.${role}`, true))
  },

  updateReadForNewMessage: (userId, transaction) => {
    const updatedReadStates = updateReadStates(userId, transaction)
    // spares a db write if updatedReadStates is already the current read state object
    if (_.sameObjects(updatedReadStates, transaction.read)) {
      return promises_.resolved
    } else {
      return db.update(transaction._id, BasicUpdater('read', updatedReadStates))
    }
  }
}

const stateUpdater = (state, userId, transaction) => {
  const updatedReadStates = updateReadStates(userId, transaction)
  return doc => {
    doc.state = state
    const action = { action: state, timestamp: Date.now() }
    // keep track of the actor when it can be both
    if (actorCanBeBoth.includes(state)) {
      const role = userRole(userId, transaction)
      action.actor = role
    }
    doc.actions.push(action)
    doc.read = updatedReadStates
    return doc
  }
}

const actorCanBeBoth = [ 'cancelled' ]

const updateReadStates = (userId, transaction) => {
  const role = userRole(userId, transaction)
  switch (role) {
  case 'owner': return { owner: true, requester: false }
  case 'requester': return { owner: false, requester: true }
  default: throw error_.new('updateReadStates err', 500, { userId, transaction })
  }
}

const userRole = (userId, transaction) => {
  const { owner, requester } = transaction
  if (userId === owner) return 'owner'
  if (userId === requester) return 'requester'
  return (() => { throw error_.new('no role found', 500, { userId, transaction }) })()
}

const counts = {
  activeTransactions: userId => {
    return transactions_.byUser(userId)
    .then(activeCount)
  }
}

const activeCount = transacs => transacs.filter(Transaction.isActive).length

const rightsVerification = require('./rights_verification')(transactions_)

module.exports = _.extend(transactions_, rightsVerification, counts)
