import transactions_ from 'controllers/transactions/lib/transactions'

const sanitization = {
  item: {},
}

const controller = async ({ itemId, reqUserId }) => {
  const transactions = await transactions_.byUserAndItem(reqUserId, itemId)
  return { transactions }
}

export default {
  sanitization,
  controller,
}
