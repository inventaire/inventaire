const comments_ = require('controllers/comments/lib/comments')
const transactions_ = require('./lib/transactions')
const { verifyRightToInteract } = require('./lib/rights_verification')
const { emit } = require('lib/radio')

module.exports = {
  get: {
    sanitization: {
      transaction: {}
    },
    controller: async ({ transactionId }) => {
      const messages = await comments_.byTransactionId(transactionId)
      return { messages }
    }
  },

  post: {
    sanitization: {
      transaction: {},
      message: {}
    },
    controller: async ({ transactionId, message, reqUserId }) => {
      const transaction = await transactions_.byId(transactionId)
      verifyRightToInteract(reqUserId, transaction)
      await comments_.addTransactionComment(reqUserId, message, transactionId)
      await transactions_.updateReadForNewMessage(reqUserId, transaction)
      await emit('transaction:message', transaction)
      return { ok: true }
    },
    track: [ 'transaction', 'message' ]
  },
}
