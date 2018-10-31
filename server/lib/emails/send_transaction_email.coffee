CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

user_ = __.require 'controllers', 'user/lib/user'
transactions_ = __.require 'controllers', 'transactions/lib/transactions'
items_ = __.require 'controllers', 'items/lib/items'
snapshot_ = __.require 'controllers', 'items/lib/snapshot/snapshot'
promises_ = __.require 'lib', 'promises'
comments_ = __.require 'controllers', 'comments/lib/comments'
Transaction = __.require 'models', 'transaction'

email_ = require './email'

module.exports = (transactionId)->
  transactions_.byId transactionId
  .then emailIsRequired
  .then fetchData
  .then sendTailoredEmail
  # catched in the final promise chain: in send_debounced_email transactionUpdate
  # after all the actions to skip are passed

emailIsRequired = (transaction)->
  role = findUserToNotify transaction
  if role?
    # progressively building the email ViewModel
    transaction.role = role
    return transaction
  else
    throw promises_.skip "sending an email isn't required", transaction

catchErr = (err)->
  if err.message is 'email_not_required' then return
  else _.error err, 'send_transaction_email err'

fetchData = (transaction)->
  promises_.all [
    user_.byId transaction.owner
    user_.byId transaction.requester
    items_.byId(transaction.item).then snapshot_.addToItem
    comments_.byTransactionId transaction._id
  ]
  .spread (owner, requester, item, messages)->
    item.title = item.snapshot['entity:title']
    image = item.snapshot['entity:image'] or transaction.snapshot.entity?.image
    # Overriding transaction document ids by the ids' docs (owner, requester, etc.)
    # for the email ViewModel
    return _.extend transaction, { owner, requester, item, messages, image }
  .then buildTimeline
  .then aliasUsers
  # .then completeActionsData

sendTailoredEmail = (transaction)->
  emailType = findEmailType transaction
  email_.transactions[emailType](transaction)

findUserToNotify = (transaction)->
  { read } = transaction
  # assumes that both can't have unread updates
  if not read.owner then return 'owner'
  else if not read.requester then return 'requester'
  else null

newTransaction = (transaction)->
  ownerActed = _.any transaction.actions, ownerIsActor
  if ownerActed then return false
  ownerSentMessage = _.any transaction.messages, OwnerIsSender(transaction)
  if ownerSentMessage then return false
  else return true

findEmailType = (transaction)->
  if transaction.role is 'owner'
    if newTransaction(transaction) then 'yourItemWasRequested'
    else 'updateOnYourItem'
  else 'updateOnItemYouRequested'

buildTimeline = (transaction)->
  { actions, messages } = transaction
  actions = formatActions transaction, actions
  messages = formatMessages transaction, messages
  timeline = _.union actions, messages
  timeline = _.sortBy timeline, (ev)-> ev.created or ev.timestamp

  return extractTimelineLastSequence transaction, timeline

# format actions and messages for ViewModels
formatActions = (transaction, actions)->
  { owner, requester } = transaction
  return actions.map (action)->
    action.user = if ownerIsActor action then owner else requester
    return action

formatMessages = (transaction, messages)->
  { owner, requester } = transaction
  return messages.map (message)->
    message.user = if ownerIsMessager owner, message then owner else requester
    return message

extractTimelineLastSequence = (transaction, timeline)->
  lastSequence = []
  lastEvent = timeline.pop()
  lastSequence.push lastEvent
  sameSequence = true
  while timeline.length > 0 and sameSequence
    prevEvent = timeline.pop()
    if prevEvent.user._id is lastEvent.user._id
      lastSequence.unshift prevEvent
    else sameSequence = false

  transaction.timeline = lastSequence
  return transaction

aliasUsers = (transaction)->
  lastEvent = transaction.timeline.slice(-1)[0]
  # deducing main and other user from the last sequence
  # as the user notified (mainUser) is necessarly the one that hasn't acted last
  transaction.other = lastEvent.user
  transaction.mainUser = findMainUser transaction
  return transaction

findMainUser = (transaction)->
  { owner, requester, other } = transaction
  if owner._id is other._id then requester
  else owner

ownerIsActor = (action)-> Transaction.states[action.action].actor is 'owner'
OwnerIsSender = (transaction)-> (message)-> message.user is transaction.owner
ownerIsMessager = (owner, message)-> message.user is owner._id

completeActionsData = (transaction)->
  { timeline, other, mainUser } = transaction
  transaction.timeline = timeline.map (ev)->
    if ev.action?
      # need to be copyied on action to be accessible
      # from inside handlebasr {{#each}} loop
      ev.lang = mainUser.language
      ev.other = other
    return ev
  return transaction
