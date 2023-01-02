import _ from '#builders/utils'
import Transaction from '#models/transaction'
import error_ from '#lib/error/error'
import comments_ from '#controllers/comments/lib/comments'
import { BasicUpdater } from '#lib/doc_updates'
import { minKey, maxKey } from '#lib/couch'
import assert_ from '#lib/utils/assert_types'
import radio from '#lib/radio'
import dbFactory from '#db/couchdb/base'

const db = dbFactory('transactions')

const transactions_ = {
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

  create: async (itemDoc, ownerDoc, requesterDoc) => {
    const transaction = Transaction.create(itemDoc, ownerDoc, requesterDoc)
    _.log(transaction, 'transaction')
    const couchRes = await db.post(transaction)
    await radio.emit('transaction:request', couchRes.id)
    return couchRes
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
    const itemsIdsToCheck = _.map(items.filter(mayBeBusy), '_id')
    const rows = await getBusyItems(itemsIdsToCheck)
    const busyItemsIds = new Set(_.map(rows, 'key'))
    return items.map(item => {
      item.busy = busyItemsIds.has(item._id)
      return item
    })
  }
}

export default transactions_

const mayBeBusy = item => item.transaction !== 'inventorying'

const getBusyItems = async itemsIds => {
  if (itemsIds.length === 0) return []
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
