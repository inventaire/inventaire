// Mark the whole transaction as read
import { getTransactionById, markTransactionAsRead } from '#controllers/transactions/lib/transactions'
import { verifyRightToInteract } from './lib/rights_verification.js'

const sanitization = {
  id: {},
}

const controller = async ({ id, reqUserId }) => {
  const transaction = await getTransactionById(id)
  verifyRightToInteract(reqUserId, transaction)
  await markTransactionAsRead(reqUserId, transaction)
  return { ok: true }
}

export default { sanitization, controller }
