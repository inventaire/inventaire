import { getTransactionsByUserAndItem } from '#controllers/transactions/lib/transactions'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  item: {},
} as const

async function controller ({ itemId, reqUserId }: SanitizedParameters) {
  const transactions = await getTransactionsByUserAndItem(reqUserId, itemId)
  return { transactions }
}

export default {
  sanitization,
  controller,
}
