CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Transaction = __.require 'models', 'transaction'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
comments_ = __.require 'controllers', 'comments/lib/comments'
{ BasicUpdater } = __.require 'lib', 'doc_updates'
{ minKey, maxKey } = __.require 'lib', 'couch'

Radio = __.require 'lib', 'radio'
sideEffects = require('./side_effects')()

db = __.require('couch', 'base')('transactions')

transactions_ =
  db: db
  byId: db.get.bind(db)
  byUser: (userId)->
    db.viewCustom 'byUserAndItem',
      # get all the docs with this userId
      startkey: [userId, minKey]
      endkey: [userId, maxKey]
      include_docs: true

  byUserAndItem: (userId, itemId)->
    _.types arguments, 'strings...'
    db.viewByKey 'byUserAndItem', [userId, itemId]

  create: (itemDoc, ownerDoc, requesterDoc)->
    transaction = Transaction.create(itemDoc, ownerDoc, requesterDoc)
    _.log transaction, 'transaction'
    db.post transaction
    .then (couchRes)->
      Radio.emit 'transaction:request', couchRes.id
      return couchRes

  addMessage: (userId, message, transactionId)->
    _.types arguments, 'strings...'
    if message?
      comments_.addTransactionComment(userId, message, transactionId)

  updateState: (newState, userId, transaction)->
    Transaction.testPossibleState transaction, newState
    db.update transaction._id, stateUpdater(newState, userId, transaction)
    .then -> Radio.emit 'transaction:update', transaction, newState

  markAsRead: (userId, transaction)->
    role = userRole userId, transaction
    # not handling cases when both user are connected:
    # should be clarified once sockets/server events will be implemented
    db.update transaction._id, BasicUpdater("read.#{role}", true)

  updateReadForNewMessage: (userId, transaction)->
    updatedReadStates = updateReadStates userId, transaction
    # spares a db write if updatedReadStates is already the current read state object
    if _.sameObjects updatedReadStates, transaction.read then promises_.resolved
    else db.update transaction._id, BasicUpdater('read', updatedReadStates)

stateUpdater = (state, userId, transaction)->
  updatedReadStates = updateReadStates userId, transaction
  return updater = (doc)->
    doc.state = state
    action = { action: state, timestamp: Date.now() }
    # keep track of the actor when it can be both
    if state in actorCanBeBoth
      role = userRole userId, transaction
      action.actor = role
    doc.actions.push action
    doc.read = updatedReadStates
    return doc

actorCanBeBoth = ['cancelled']

updateReadStates = (userId, transaction)->
  role = userRole userId, transaction
  switch role
    when 'owner' then return {owner: true, requester: false}
    when 'requester' then return {owner: false, requester: true}
    else throw error_.new 'updateReadStates err', 500, arguments

userRole = (userId, transaction)->
  { owner, requester } = transaction
  if userId is owner then return 'owner'
  if userId is requester then return 'requester'
  return throw error_.new 'no role found', 500, arguments

counts =
  activeTransactions: (userId)->
    transactions_.byUser userId
    .then activeCount

activeCount = (transacs)-> transacs.filter(Transaction.isActive).length

rightsVerification = require('./rights_verification')(transactions_)

module.exports = _.extend transactions_, rightsVerification, counts
