// Add emails to the waiting list to let ./debounced_emails_crawler
// find and send them

import _ from 'builders/utils'

import dbFactory from 'db/level/get_sub_db'
import { emptyValue } from 'db/level/utils'
const db = dbFactory('waiting', 'utf8')

export default {
  transactionUpdate: transaction => {
    // Polymorphism: accepts transaction doc or directly the transaction _id
    let transactionId
    if (_.isObject(transaction)) {
      transactionId = transaction._id
    } else if (_.isString(transaction)) {
      transactionId = transaction
    } else {
      _.warn({ transaction }, 'bad type at transactionUpdate')
      return
    }

    return addToWaitingList('transactionUpdate', transactionId)
  }
}

// Delete and repost with new time to wait
// as long as updates are arriving fast (i.e. in a 30 minutes timespan)
const addToWaitingList = (domain, id) => {
  return db.createKeyStream({
    gt: `${domain}:${id}:0`,
    lt: `${domain}:${id}::`
  })
  // TODO: refactor to delete in batch
  .on('data', db.del.bind(db))
  .on('end', createNewWaiter.bind(null, domain, id))
}

const createNewWaiter = (domain, id) => {
  const key = `${domain}:${id}:${Date.now()}`
  return db.put(key, emptyValue)
}
