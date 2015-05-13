CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Transaction = __.require 'models', 'transaction'
error_ = __.require 'lib', 'error/error'
interactions_ = __.require 'lib', 'interactions'
comments_ = __.require 'controllers', 'comments/lib/comments'

db = __.require('couch', 'base')('transactions')

module.exports =
  db: db
  byId: db.get.bind(db)
  byUser: (userId)->
    db.viewByKey 'byUser', userId

  create: (userId, item)->
    transaction = Transaction.create(userId, item)
    _.log transaction, 'transaction'
    db.post transaction

  verifyRequesterRight: (requester, item)->
    # the owner of the item isnt allowed to request it
    ownerAllowed = false
    interactions_.verifyRightToInteract(requester, item, ownerAllowed)

  addMessage: (userId, message, transactionId)->
    _.types arguments, 'strings...'
    if message?
      comments_.addTransactionComment(userId, message, transactionId)
