import comments_ from 'controllers/comments/lib/comments'

const sanitization = {
  transaction: {},
}

const controller = async ({ transactionId }) => {
  const messages = await comments_.byTransactionId(transactionId)
  return { messages }
}

export default {
  sanitization,
  controller,
}
