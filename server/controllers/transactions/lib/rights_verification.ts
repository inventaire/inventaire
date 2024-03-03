import { newError } from '#lib/error/error'
import { verifyRightToInteractWithItem } from '#lib/interactions'
import { transactionIsActive } from '#models/transaction'
import type { Item } from '#types/item'
import type { Transaction } from '#types/transaction'
import type { UserId } from '#types/user'

let getTransactionsByUserAndItem, checkIfItemIsBusy
const importCircularDependencies = async () => {
  ({ getTransactionsByUserAndItem, checkIfItemIsBusy } = await import('./transactions.js'))
}
setImmediate(importCircularDependencies)

async function verifyNoExistingTransaction (reqUserId: UserId, item: Item) {
  const transactionsDocs = await getTransactionsByUserAndItem(reqUserId, item._id)
  const activeTransactionsDocs = transactionsDocs.filter(transactionIsActive)
  if (activeTransactionsDocs.length > 0) {
    const message = 'user already made a request on this item'
    throw newError(message, 403, { reqUserId, item, activeTransaction: activeTransactionsDocs[0] })
  } else {
    return item
  }
}

export async function verifyRightToRequest (reqUserId: UserId, item: Item) {
  const itemIsBusy = await checkIfItemIsBusy(item._id)
  if (itemIsBusy) {
    throw newError('item already busy', 403, { item })
  }
  await verifyRightToInteractWithItem({ reqUserId, item, ownerAllowed: false })
  await verifyNoExistingTransaction(reqUserId, item)
}

export function verifyRightToInteractWithTransaction (userId: UserId, transaction: Transaction) {
  const { owner, requester } = transaction
  if (!(userId === owner || userId === requester)) {
    throw newError('wrong user', 403, { userId, transaction })
  }
}

export function verifyIsOwner (userId: UserId, transaction: Transaction) {
  const { owner } = transaction
  if (userId !== owner) {
    throw newError('wrong user', 403, { userId, transaction })
  }
}

export function verifyIsRequester (userId: UserId, transaction: Transaction) {
  const { requester } = transaction
  if (userId !== requester) {
    throw newError('wrong user', 403, { userId, transaction })
  }
}
