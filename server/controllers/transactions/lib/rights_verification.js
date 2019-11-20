const __ = require('config').universalPath
const interactions_ = __.require('lib', 'interactions')
const error_ = __.require('lib', 'error/error')
const Transaction = __.require('models', 'transaction')

module.exports = transactions_ => {
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

  return {
    verifyRightToRequest: (requester, item) => {
      if (item.busy) {
        throw error_.new('this item is busy', 403, item)
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
      if (userId === owner || userId === requester) {
        return transaction
      } else {
        throw error_.new('wrong user', 403, userId, transaction)
      }
    },

    verifyIsOwner: (userId, transaction) => {
      const { owner } = transaction
      if (userId === owner) {
        return transaction
      } else {
        throw error_.new('wrong user', 403, userId, transaction)
      }
    },

    verifyIsRequester: (userId, transaction) => {
      const { requester } = transaction
      if (userId === requester) {
        return transaction
      } else {
        throw error_.new('wrong user', 403, userId, transaction)
      }
    }
  }
}
