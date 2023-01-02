import comments_ from '#controllers/comments/lib/comments'
import { emit } from '#lib/radio'
import transactions_ from './lib/transactions.js'
import { verifyRightToInteract } from './lib/rights_verification.js'

const sanitization = {
  transaction: {},
  message: {}
}

const controller = async ({ transactionId, message, reqUserId }) => {
  const transaction = await transactions_.byId(transactionId)
  verifyRightToInteract(reqUserId, transaction)
  await comments_.addTransactionComment(reqUserId, message, transactionId)
  await transactions_.updateReadForNewMessage(reqUserId, transaction)
  await emit('transaction:message', transaction)
  return { ok: true }
}

export default {
  sanitization,
  controller,
  track: [ 'transaction', 'message' ]
}
