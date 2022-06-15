const comments_ = require('controllers/comments/lib/comments')
const transactions_ = require('./lib/transactions')
const { verifyRightToInteract } = require('./lib/rights_verification')
const { emit } = require('lib/radio')

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

module.exports = {
  sanitization,
  controller,
  track: [ 'transaction', 'message' ]
}
