// Mark the whole transaction as read
import { getTransactionById, markTransactionAsRead } from '#controllers/transactions/lib/transactions'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { verifyRightToInteractWithTransaction } from './lib/rights_verification.js'

const sanitization = {
  id: {},
} as const

async function controller ({ id, reqUserId }: SanitizedParameters) {
  const transaction = await getTransactionById(id)
  verifyRightToInteractWithTransaction(reqUserId, transaction)
  await markTransactionAsRead(reqUserId, transaction)
  return { ok: true }
}

export default { sanitization, controller }
