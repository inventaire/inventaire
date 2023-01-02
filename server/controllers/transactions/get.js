import { getTransactionsByUser } from '#controllers/transactions/lib/transactions'

export default {
  sanitization: {},
  controller: async ({ reqUserId }) => {
    const transactions = await getTransactionsByUser(reqUserId)
    return { transactions }
  },
}
