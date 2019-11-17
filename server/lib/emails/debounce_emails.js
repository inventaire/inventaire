// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Add emails to the waiting list to let server/lib/emails/debounced_emails_crawler
// find and send them

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const waitingEmails = require('./waiting_emails')

module.exports = {
  transactionUpdate: transaction => {
    // Polymorphism: accepts transaction doc or directly the transaction _id
    let transactionId
    if (_.isObject(transaction)) {
      transactionId = transaction._id
    } else if (_.isString(transaction)) {
      transactionId = transaction
    } else {
      return _.error(arguments, 'bad type at transactionUpdate')
    }

    return addToWaitingList('transactionUpdate', transactionId)
  }
}

// Delete and repost with new time to wait
// as long as updates are arriving fast (i.e. in a 30 minutes timespan)
const addToWaitingList = (domain, id) => waitingEmails.sub.createKeyStream({
  gt: `${domain}:${id}:0`,
  lt: `${domain}:${id}::`
}).on('data', waitingEmails.del)
.on('end', createNewWaiter.bind(null, domain, id))

const createNewWaiter = (domain, id) => {
  const key = `${domain}:${id}:${Date.now()}`
  return waitingEmails.put(key, {})
}
