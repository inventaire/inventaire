const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const transactions_ = require('./lib/transactions')
const user_ = require('controllers/user/lib/user')
const { verifyRightToRequest } = require('./lib/rights_verification')

const sanitization = {
  item: {},
  message: {}
}

const controller = async ({ item, message, reqUserId }) => {
  _.log([ item, message ], 'item request')
  const itemDoc = await items_.byId(item)
  await verifyRightToRequest(reqUserId, itemDoc)
  await snapshot_.addToItem(itemDoc)
  const { owner: ownerId } = itemDoc
  const [ ownerDoc, requesterDoc ] = await user_.byIds([ ownerId, reqUserId ])
  const { id: transactionId } = await transactions_.create(itemDoc, ownerDoc, requesterDoc)
  await transactions_.addMessage(reqUserId, message, transactionId)
  const transaction = await transactions_.byId(transactionId)
  return { transaction }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'transaction', 'request' ]
}
