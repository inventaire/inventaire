require('should')
const { getUser, getUserB, authReq, customAuthReq } = require('apiTests/utils/utils')
const { wait } = require('lib/promises')
const { createItem } = require('./items')
const { getById: getRefreshedItem } = require('../utils/items')

const createTransaction = async (params = {}) => {
  let {
    userA = getUser(),
    userB = getUserB(),
    itemData
  } = params
  userA = await userA
  userB = await userB
  itemData = itemData || { listing: 'public', transaction: 'giving' }
  const item = await createItem(userB, itemData)
  await wait(100)
  const refreshedItem = await getRefreshedItem(item)
  const res = await customAuthReq(userA, 'post', '/api/transactions?action=request', {
    item: item._id,
    message: 'yo'
  })
  Object.assign(res, { userA, userB, userBItem: refreshedItem })
  return res
}

let someTransactionData
const getSomeTransaction = async () => {
  someTransactionData = someTransactionData || await createTransaction()
  return someTransactionData
}

module.exports = {
  createTransaction,

  getSomeTransaction,

  addMessage: transaction => {
    return authReq('post', '/api/transactions?action=message', {
      action: 'message',
      transaction: transaction._id,
      message: 'yo'
    })
  }
}
