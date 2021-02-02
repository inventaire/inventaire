const _ = require('builders/utils')
const Transaction = require('models/transaction')
const error_ = require('lib/error/error')
const comments_ = require('controllers/comments/lib/comments')
const { BasicUpdater } = require('lib/doc_updates')
const { minKey, maxKey } = require('lib/couch')
const assert_ = require('lib/utils/assert_types')
const radio = require('lib/radio')
const db = require('db/couchdb/base')('transactions')

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

  updateState: async (transaction, newState, userId) => {
    Transaction.validatePossibleState(transaction, newState)
    await db.update(transaction._id, stateUpdater(newState, userId, transaction))
    await radio.emit('transaction:update', transaction, newState)
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
    await Promise.all(activeTransactions.map(transaction => {
      return transactions_.updateState(transaction, 'cancelled', userId)
    }))
  },

  itemIsBusy: async itemId => {
    assert_.string(itemId)
    const rows = await getBusyItems([ itemId ])
    return rows.length > 0
  },

  setItemsBusyFlag: async items => {
    assert_.objects(items)
    if (items.length === 0) return items
    const itemsIds = _.map(items, '_id')
    const rows = await getBusyItems(itemsIds)
    const busyItemsIds = new Set(_.map(rows, 'key'))
    return items.map(item => {
      item.busy = busyItemsIds.has(item._id)
      return item
    })
  }
}

const getBusyItems = async itemsIds => {
  const { rows } = await db.viewKeys('transactions', 'byBusyItem', itemsIds, { include_docs: false })
  return rows
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
