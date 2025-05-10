import comments_ from '#controllers/comments/lib/comments'
import { getTransactionById, updateReadForNewMessage } from '#controllers/transactions/lib/transactions'
import { emit } from '#lib/radio'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { verifyRightToInteractWithTransaction } from './lib/rights_verification.js'

const sanitization = {
  transaction: {},
  message: {},
} as const

async function controller ({ transactionId, message, reqUserId }: SanitizedParameters) {
  const transaction = await getTransactionById(transactionId)
  verifyRightToInteractWithTransaction(reqUserId, transaction)
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
