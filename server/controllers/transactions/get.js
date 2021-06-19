const transactions_ = require('./lib/transactions')

module.exports = {
  sanitization: {},
  controller: async ({ reqUserId }) => {
    const transactions = await transactions_.byUser(reqUserId)
    return { transactions }
  }
}
