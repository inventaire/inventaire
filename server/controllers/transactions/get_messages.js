const comments_ = require('controllers/comments/lib/comments')

const sanitization = {
  transaction: {},
}

const controller = async ({ transactionId }) => {
  const messages = await comments_.byTransactionId(transactionId)
  return { messages }
}

module.exports = {
  sanitization,
  controller,
}
