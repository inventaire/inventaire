import 'should'
import { wait } from '#lib/promises'
import { getItem } from '#tests/api/utils/items'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser, getUserB, authReq } from '#tests/api/utils/utils'
import { createItem } from './items.js'

export async function createTransaction (params = {}) {
  const [ requester, owner ] = await Promise.all([
    params.requester || getUser(),
    params.owner || getUserB(),
  ])
  let { item, itemData } = params
  if (!item) {
    itemData ??= { visibility: [ 'public' ], transaction: 'giving' }
    item = await createItem(owner, itemData)
  }
  await wait(100)
  const refreshedItem = await getItem(item)
  const res = await customAuthReq(requester, 'post', '/api/transactions?action=request', {
    item: item._id,
    message: 'yo',
  })
  Object.assign(res, { requester, owner, item: refreshedItem })
  return res
}

let someTransactionData
export const getSomeTransaction = async () => {
  someTransactionData ??= await createTransaction()
  return someTransactionData
}

export function addMessage (transaction) {
  return authReq('post', '/api/transactions?action=message', {
    action: 'message',
    transaction: transaction._id,
    message: 'yo',
  })
}
