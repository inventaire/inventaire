import comments_ from '#controllers/comments/lib/comments'

const sanitization = {
  transaction: {},
}

async function controller ({ transactionId }) {
  const messages = await comments_.byTransactionId(transactionId)
  return { messages }
}

export default {
  sanitization,
  controller,
}
