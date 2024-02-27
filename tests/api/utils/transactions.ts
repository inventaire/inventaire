import { customAuthReq } from '#tests/api/utils/request'

const endpoint = '/api/transactions'

const getAllUserTransactions = user => customAuthReq(user, 'get', endpoint)

export async function getTransaction (user, id) {
  const { transactions } = await getAllUserTransactions(user)
  const transaction = transactions.find(doc => doc._id === id)
  if (transaction) return transaction
  else throw new Error(`transaction not found: ${id}`)
}

export function getTransactionsByItem (user, itemId) {
  return customAuthReq(user, 'get', `${endpoint}?action=by-item&item=${itemId}`)
}

export async function updateTransaction (user, transactionId, state) {
  transactionId = transactionId._id || transactionId
  return customAuthReq(user, 'put', `${endpoint}?action=update-state`, {
    transaction: transactionId,
    state,
  })
}
