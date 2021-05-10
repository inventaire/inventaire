const interactions_ = require('lib/interactions')
const error_ = require('lib/error/error')
const Transaction = require('models/transaction')

let transactions_
const requireCircularDependencies = () => { transactions_ = require('./transactions') }
setImmediate(requireCircularDependencies)

const verifyNoExistingTransaction = (requester, item) => {
  return transactions_.byUserAndItem(requester, item._id)
  .then(transactionsDocs => {
    const activeTransactionsDocs = transactionsDocs.filter(Transaction.isActive)

    if (activeTransactionsDocs.length > 0) {
      const message = 'user already made a request on this item'
      throw error_.new(message, 403, requester, item, activeTransactionsDocs[0])
    } else {
      return item
    }
  })
}

module.exports = {
  verifyRightToRequest: async (requester, item) => {
    const itemIsBusy = await transactions_.itemIsBusy(item._id)
    if (itemIsBusy) {
      throw error_.new('item already busy', 403, item)
    }

    // the owner of the item isnt allowed to request it
    const ownerAllowed = false
    // will throw sync if the test isn't passed
    interactions_.verifyRightToInteract(requester, item, ownerAllowed)
    // will be a rejected promise if the test isn't passed
    return verifyNoExistingTransaction(requester, item)
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
