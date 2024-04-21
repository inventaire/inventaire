import { getTransactionsByUserAndItem } from '#controllers/transactions/lib/transactions'

const sanitization = {
  item: {},
}

async function controller ({ itemId, reqUserId }) {
  const transactions = await getTransactionsByUserAndItem(reqUserId, itemId)
  return { transactions }
}

export default {
  sanitization,
  controller,
}
