// Mark the whole transaction as read

import transactions_ from './lib/transactions.js'
import { verifyRightToInteract } from './lib/rights_verification.js'

const sanitization = {
  id: {}
}

const controller = async ({ id, reqUserId }) => {
  const transaction = await transactions_.byId(id)
  verifyRightToInteract(reqUserId, transaction)
  await transactions_.markAsRead(reqUserId, transaction)
  return { ok: true }
}

export default { sanitization, controller }
