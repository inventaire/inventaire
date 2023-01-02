import _ from '#builders/utils'
import items_ from '#controllers/items/lib/items'
import snapshot_ from '#controllers/items/lib/snapshot/snapshot'
import user_ from '#controllers/user/lib/user'
import transactions_ from './lib/transactions.js'
import { verifyRightToRequest } from './lib/rights_verification.js'

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

export default {
  sanitization,
  controller,
  track: [ 'transaction', 'request' ]
}
