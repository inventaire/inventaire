CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Transaction = __.require 'models', 'transaction'
error_ = __.require 'lib', 'error/error'
comments_ = __.require 'controllers', 'comments/lib/comments'
rightsVerification = require './rights_verification'

Radio = __.require 'lib', 'radio'
sideEffects = require('./side_effects')()

db = __.require('couch', 'base')('transactions')

module.exports = _.extend {}, rightsVerification,
  db: db
  byId: db.get.bind(db)
  byUser: (userId)->
    db.viewByKey 'byUser', userId

  create: (userId, item)->
    transaction = Transaction.create(userId, item)
    _.log transaction, 'transaction'
    db.post transaction

  addMessage: (userId, message, transactionId)->
    _.types arguments, 'strings...'
    if message?
      comments_.addTransactionComment(userId, message, transactionId)

  updateState: (newState, transaction)->
    Transaction.testPossibleState transaction, newState
    db.update transaction._id, UpdateState(newState)
    Radio.emit 'transaction:update', transaction, newState

UpdateState = (state)->
  updater = (doc)->
    doc.state = state
    doc.actions.push { action: state, timestamp: _.now() }
    return doc
