import _ from '#builders/utils'
import { getItemById } from '#controllers/items/lib/items'
import { addSnapshotToItem } from '#controllers/items/lib/snapshot/snapshot'
import { addTransactionMessage, createTransaction, getTransactionById } from '#controllers/transactions/lib/transactions'
import { getUsersByIds } from '#controllers/user/lib/user'
import { verifyRightToRequest } from './lib/rights_verification.js'

const sanitization = {
  item: {},
  message: {},
}

const controller = async ({ item, message, reqUserId }) => {
  _.log([ item, message ], 'item request')
  const itemDoc = await getItemById(item)
  await verifyRightToRequest(reqUserId, itemDoc)
  await addSnapshotToItem(itemDoc)
  const { owner: ownerId } = itemDoc
  const [ ownerDoc, requesterDoc ] = await getUsersByIds([ ownerId, reqUserId ])
  const { id: transactionId } = await createTransaction(itemDoc, ownerDoc, requesterDoc)
  await addTransactionMessage(reqUserId, message, transactionId)
  const transaction = await getTransactionById(transactionId)
  return { transaction }
}

export default {
  sanitization,
  controller,
  track: [ 'transaction', 'request' ],
}
