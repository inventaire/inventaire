import { getTransactionsByUserAndItem } from '#controllers/transactions/lib/transactions'

const sanitization = {
  item: {},
}

const controller = async ({ itemId, reqUserId }) => {
  const transactions = await getTransactionsByUserAndItem(reqUserId, itemId)
  return { transactions }
}

export default {
  sanitization,
  controller,
}
