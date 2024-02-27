import { newError } from '#lib/error/error'
import { verifyRightToInteractWithItem } from '#lib/interactions'
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
    throw newError(message, 403, reqUserId, item, activeTransactionsDocs[0])
  } else {
    return item
  }
}

export async function verifyRightToRequest (reqUserId, item) {
  const itemIsBusy = await checkIfItemIsBusy(item._id)
  if (itemIsBusy) {
    throw newError('item already busy', 403, item)
  }
  await verifyRightToInteractWithItem({ reqUserId, item, ownerAllowed: false })
  await verifyNoExistingTransaction(reqUserId, item)
}

export function verifyRightToInteractWithTransaction (userId, transaction) {
  const { owner, requester } = transaction
  if (!(userId === owner || userId === requester)) {
    throw newError('wrong user', 403, userId, transaction)
  }
}

export function verifyIsOwner (userId, transaction) {
  const { owner } = transaction
  if (userId !== owner) {
    throw newError('wrong user', 403, userId, transaction)
  }
}

export function verifyIsRequester (userId, transaction) {
  const { requester } = transaction
  if (userId !== requester) {
    throw newError('wrong user', 403, userId, transaction)
  }
}
