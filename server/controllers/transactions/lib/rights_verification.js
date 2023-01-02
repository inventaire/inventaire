import { error_ } from '#lib/error/error'
import interactions_ from '#lib/interactions'
import Transaction from '#models/transaction'

let getTransactionsByUserAndItem, checkIfItemIsBusy
const importCircularDependencies = async () => {
  ({ getTransactionsByUserAndItem, checkIfItemIsBusy } = await import('./transactions.js'))
}
setImmediate(importCircularDependencies)

const verifyNoExistingTransaction = async (reqUserId, item) => {
  const transactionsDocs = await getTransactionsByUserAndItem(reqUserId, item._id)
  const activeTransactionsDocs = transactionsDocs.filter(Transaction.isActive)
  if (activeTransactionsDocs.length > 0) {
    const message = 'user already made a request on this item'
    throw error_.new(message, 403, reqUserId, item, activeTransactionsDocs[0])
  } else {
    return item
  }
}

export async function verifyRightToRequest (reqUserId, item) {
  const itemIsBusy = await checkIfItemIsBusy(item._id)
  if (itemIsBusy) {
    throw error_.new('item already busy', 403, item)
  }
  await interactions_.verifyRightToInteract({ reqUserId, item, ownerAllowed: false })
  await verifyNoExistingTransaction(reqUserId, item)
}

export const verifyRightToInteract = (userId, transaction) => {
  const { owner, requester } = transaction
  if (!(userId === owner || userId === requester)) {
    throw error_.new('wrong user', 403, userId, transaction)
  }
}

export const verifyIsOwner = (userId, transaction) => {
  const { owner } = transaction
  if (userId !== owner) {
    throw error_.new('wrong user', 403, userId, transaction)
  }
}

export const verifyIsRequester = (userId, transaction) => {
  const { requester } = transaction
  if (userId !== requester) {
    throw error_.new('wrong user', 403, userId, transaction)
  }
}
