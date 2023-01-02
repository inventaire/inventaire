import comments_ from '#controllers/comments/lib/comments'
import { getTransactionById, updateReadForNewMessage } from '#controllers/transactions/lib/transactions'
import { emit } from '#lib/radio'
import { verifyRightToInteract } from './lib/rights_verification.js'

const sanitization = {
  transaction: {},
  message: {},
}

const controller = async ({ transactionId, message, reqUserId }) => {
  const transaction = await getTransactionById(transactionId)
  verifyRightToInteract(reqUserId, transaction)
  await comments_.addTransactionComment(reqUserId, message, transactionId)
  await updateReadForNewMessage(reqUserId, transaction)
  await emit('transaction:message', transaction)
  return { ok: true }
}

export default {
  sanitization,
  controller,
  track: [ 'transaction', 'message' ],
}
