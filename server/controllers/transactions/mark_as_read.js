// Mark the whole transaction as read

const transactions_ = require('./lib/transactions')
const { verifyRightToInteract } = require('./lib/rights_verification')

const sanitization = {
  id: {}
}

const controller = async ({ id, reqUserId }) => {
  const transaction = await transactions_.byId(id)
  verifyRightToInteract(reqUserId, transaction)
  await transactions_.markAsRead(reqUserId, transaction)
  return { ok: true }
}

module.exports = { sanitization, controller }
