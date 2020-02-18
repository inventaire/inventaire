const { customAuthReq } = require('../utils/utils')

const endpoint = '/api/transactions'

const getAllUserTransactions = user => customAuthReq(user, 'get', endpoint)

module.exports = {
  getTransaction: async (user, id) => {
    const { transactions } = await getAllUserTransactions(user)
    const transaction = transactions.find(doc => doc._id === id)
    if (transaction) return transaction
    else throw new Error(`transaction not found: ${id}`)
  },

  updateTransaction: async (user, transactionId, state) => {
    return customAuthReq(user, 'put', `${endpoint}?action=update-state`, {
      transaction: transactionId,
      state
    })
  }
}
