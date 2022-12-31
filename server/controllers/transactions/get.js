import transactions_ from './lib/transactions'

export default {
  sanitization: {},
  controller: async ({ reqUserId }) => {
    const transactions = await transactions_.byUser(reqUserId)
    return { transactions }
  }
}
