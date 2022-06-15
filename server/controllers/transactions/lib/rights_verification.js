const interactions_ = require('lib/interactions')
const error_ = require('lib/error/error')
const Transaction = require('models/transaction')

let transactions_
const requireCircularDependencies = () => { transactions_ = require('./transactions') }
setImmediate(requireCircularDependencies)

const verifyNoExistingTransaction = async (reqUserId, item) => {
  const transactionsDocs = await transactions_.byUserAndItem(reqUserId, item._id)
  const activeTransactionsDocs = transactionsDocs.filter(Transaction.isActive)
  if (activeTransactionsDocs.length > 0) {
    const message = 'user already made a request on this item'
    throw error_.new(message, 403, reqUserId, item, activeTransactionsDocs[0])
  } else {
    return item
  }
}

module.exports = {
  verifyRightToRequest: async (reqUserId, item) => {
    const itemIsBusy = await transactions_.itemIsBusy(item._id)
    if (itemIsBusy) {
      throw error_.new('item already busy', 403, item)
    }
    await interactions_.verifyRightToInteract({ reqUserId, item, ownerAllowed: false })
    await verifyNoExistingTransaction(reqUserId, item)
  },

  verifyRightToInteract: (userId, transaction) => {
    const { owner, requester } = transaction
    if (!(userId === owner || userId === requester)) {
      throw error_.new('wrong user', 403, userId, transaction)
    }
  },

  verifyIsOwner: (userId, transaction) => {
    const { owner } = transaction
    if (userId !== owner) {
      throw error_.new('wrong user', 403, userId, transaction)
    }
  },

  verifyIsRequester: (userId, transaction) => {
    const { requester } = transaction
    if (userId !== requester) {
      throw error_.new('wrong user', 403, userId, transaction)
    }
  }
}
