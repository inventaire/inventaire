import comments_ from '#controllers/comments/lib/comments'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  transaction: {},
}

async function controller ({ transactionId }: SanitizedParameters) {
  const messages = await comments_.byTransactionId(transactionId)
  return { messages }
}

export default {
  sanitization,
  controller,
}
