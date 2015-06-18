CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
waitingEmails = __.require('level', 'base').simpleAPI 'waiting'

module.exports =
  transactionUpdate: (transaction)->
    # Polymorphism: accepts transaction doc or directly the transaction _id
    if _.isObject transaction then transactionId = transaction._id
    else if _.isString transaction then transactionId = transaction
    else return _.error arguments, 'bad type at transactionUpdate'

    addToWaitingList 'transactionUpdate', transactionId


addToWaitingList = (domain, id)->
  findPreviousWaiters domain, id

# delete and repost with new time to wait
# as long as updates are arriving fast (i.e. in a 30 minutes timespan)
findPreviousWaiters = (domain, id)->
  waitingEmails.sub.createKeyStream
    gt: "#{domain}:#{id}:0"
    lt: "#{domain}:#{id}::"
  .on 'data', waitingEmails.del
  .on 'end', createNewWaiter.bind(null, domain, id)


createNewWaiter = (domain, id)->
  key = "#{domain}:#{id}:#{_.now()}"
  waitingEmails.put key, {}
