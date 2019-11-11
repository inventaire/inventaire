__ = require('config').universalPath
_ = __.require 'builders', 'utils'
interactions_ = __.require 'lib', 'interactions'
error_ = __.require 'lib', 'error/error'
Transaction = __.require 'models', 'transaction'

module.exports = (transactions_)->

  verifyNoExistingTransaction = (requester, item)->
    transactions_.byUserAndItem requester, item._id
    .then (transactionsDocs)->
      activeTransactionsDocs = transactionsDocs.filter Transaction.isActive

      if activeTransactionsDocs.length > 0
        message = 'user already made a request on this item'
        throw error_.new message, 403, requester, item, activeTransactionsDocs[0]
      else
        return item

  return API =
    verifyRightToRequest: (requester, item)->
      if item.busy
        throw error_.new 'this item is busy', 403, item

      # the owner of the item isnt allowed to request it
      ownerAllowed = false
      # will throw sync if the test isn't passed
      interactions_.verifyRightToInteract requester, item, ownerAllowed
      # will be a rejected promise if the test isn't passed
      return verifyNoExistingTransaction requester, item

    verifyRightToInteract: (userId, transaction)->
      { _id, owner, requester } = transaction
      if userId is owner or userId is requester then return transaction
      else throw error_.new 'wrong user', 403, userId, transaction

    verifyIsOwner: (userId, transaction)->
      { owner } = transaction
      if userId is owner then return transaction
      else throw error_.new 'wrong user', 403, userId, transaction

    verifyIsRequester: (userId, transaction)->
      { requester } = transaction
      if userId is requester then return transaction
      else throw error_.new 'wrong user', 403, userId, transaction
