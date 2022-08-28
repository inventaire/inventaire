const transactions_ = require('controllers/transactions/lib/transactions')

const sanitization = {
  item: {},
}

const controller = async ({ itemId, reqUserId }) => {
  const transactions = await transactions_.byUserAndItem(reqUserId, itemId)
  return { transactions }
}

module.exports = {
  sanitization,
  controller,
}
