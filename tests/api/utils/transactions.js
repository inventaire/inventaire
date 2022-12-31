import { customAuthReq } from '../utils/utils'

const endpoint = '/api/transactions'

const getAllUserTransactions = user => customAuthReq(user, 'get', endpoint)

const getTransaction = async (user, id) => {
  const { transactions } = await getAllUserTransactions(user)
  const transaction = transactions.find(doc => doc._id === id)
  if (transaction) return transaction
  else throw new Error(`transaction not found: ${id}`)
}

const getTransactionsByItem = (user, itemId) => {
  return customAuthReq(user, 'get', `${endpoint}?action=by-item&item=${itemId}`)
}

const updateTransaction = async (user, transactionId, state) => {
  transactionId = transactionId._id || transactionId
  return customAuthReq(user, 'put', `${endpoint}?action=update-state`, {
    transaction: transactionId,
    state
  })
}

export default {
  getTransaction,
  getTransactionsByItem,
  updateTransaction,
}
