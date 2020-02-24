const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { getUser, getUserB, authReq, customAuthReq } = __.require('apiTests', 'utils/utils')
const { Wait } = __.require('lib', 'promises')
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

const addAuthorToItemEditionWork = item => {
  return getEntityByUri(item.entity)
  .then(edition => {
    const workUri = edition.claims['wdt:P629'][0]
    return addAuthor(workUri)
  })
  .then(Wait(1000))
}
