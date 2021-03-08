const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const Transaction = __.require('models', 'transaction')
const error_ = __.require('lib', 'error/error')
const comments_ = __.require('controllers', 'comments/lib/comments')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const { minKey, maxKey } = __.require('lib', 'couch')
const assert_ = __.require('lib', 'utils/assert_types')
const radio = __.require('lib', 'radio')
const db = __.require('db', 'couchdb/base')('transactions')

const transactions_ = module.exports = {
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
    if (message) {
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
    // Not handling cases when both user are connected:
    // should be clarified once sockets/server events will be implemented
    return db.update(transaction._id, BasicUpdater(`read.${role}`, true))
  },

  updateReadForNewMessage: async (userId, transaction) => {
    const updatedReadStates = updateReadStates(userId, transaction)
    // Spares a db write if updatedReadStates is already the current read state object
    if (_.sameObjects(updatedReadStates, transaction.read)) return
    return db.update(transaction._id, BasicUpdater('read', updatedReadStates))
  },

  activeTransactionsCount: userId => {
    return transactions_.byUser(userId)
    .then(activeCount)
  },

  cancelAllActiveTransactions: async userId => {
    const transactions = await transactions_.byUser(userId)
    const activeTransactions = transactions.filter(Transaction.isActive)
    return Promise.all(activeTransactions.map(transaction => {
      return transactions_.updateState('cancelled', userId, transaction)
    }))
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
  if (role === 'owner') return { owner: true, requester: false }
  else if (role === 'requester') return { owner: false, requester: true }
  else throw error_.new('updateReadStates err', 500, { userId, transaction })
}

const userRole = (userId, transaction) => {
  const { owner, requester } = transaction
  if (userId === owner) return 'owner'
  else if (userId === requester) return 'requester'
  else throw error_.new('no role found', 500, { userId, transaction })
}

const activeCount = transactions => transactions.filter(Transaction.isActive).length
