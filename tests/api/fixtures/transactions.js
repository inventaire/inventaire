const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { getUser, getUserB, authReq, customAuthReq } = __.require('apiTests', 'utils/utils')
const { wait } = __.require('lib', 'promises')
const { createItem } = require('./items')
const { addAuthor } = require('./entities')
const { getByUri: getEntityByUri } = require('../utils/entities')
const { getById: getRefreshedItem } = require('../utils/items')

module.exports = {
  createTransaction: async (userA, userB) => {
    userA = userA || await getUser()
    userB = userB || await getUserB()
    const item = await createItem(userB, { listing: 'public', transaction: 'giving' })
    await addAuthorToItemEditionWork(item)
    const refreshedItem = await getRefreshedItem(item)
    const res = await customAuthReq(userA, 'post', '/api/transactions?action=request', {
      item: item._id,
      message: 'yo'
    })
    Object.assign(res, { userA, userB, userBItem: refreshedItem })
    return res
  },

  addMessage: transaction => {
    return authReq('post', '/api/transactions?action=message', {
      action: 'message',
      transaction: transaction._id,
      message: 'yo'
    })
  }
}

const addAuthorToItemEditionWork = async item => {
  const edition = await getEntityByUri(item.entity)
  const workUri = edition.claims['wdt:P629'][0]
  await addAuthor(workUri)
  await wait(1000)
}
