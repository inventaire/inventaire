// Add emails to the waiting list to let ./debounced_emails_crawler
// find and send them
import { isObject, isString } from 'lodash-es'
import leveldbFactory from '#db/level/get_sub_db'
import { emptyValue } from '#db/level/utils'
import { warn } from '#lib/utils/logs'
import type { Transaction, TransactionId } from '#types/transaction'

const db = leveldbFactory('waiting', 'utf8')

export function transactionUpdate (transaction: Transaction | TransactionId) {
  // Polymorphism: accepts transaction doc or directly the transaction _id
  let transactionId
  if (isObject(transaction)) {
    transactionId = transaction._id
  } else if (isString(transaction)) {
    transactionId = transaction
  } else {
    warn({ transaction }, 'bad type at transactionUpdate')
    return
  }

  return addToWaitingList('transactionUpdate', transactionId)
}

// Delete and repost with new time to wait
// as long as updates are arriving fast (i.e. in a 30 minutes timespan)
const addToWaitingList = (domain, id) => {
  return db.createKeyStream({
    gt: `${domain}:${id}:0`,
    lt: `${domain}:${id}::`,
  })
  // TODO: refactor to delete in batch
  .on('data', db.del.bind(db))
  .on('end', createNewWaiter.bind(null, domain, id))
}

const createNewWaiter = (domain, id) => {
  const key = `${domain}:${id}:${Date.now()}`
  return db.put(key, emptyValue)
}
