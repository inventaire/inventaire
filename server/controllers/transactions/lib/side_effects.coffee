# Transactions side effects:
# mainly changing item availability (toggling items' "busy" attribute)
# and moving items between inventories (actually archiving in one and forking in the other)

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
Transaction = __.require 'models', 'transaction'
items_ = __.require 'controllers', 'items/lib/items'

module.exports = ->
  radio.on 'transaction:update', applySideEffects

applySideEffects = (transacDoc, newState)->
  _.log arguments, 'applySideEffects'
  sideEffects[newState](transacDoc, newState)

setItemBusyness = (busy, transacDoc)->
  _.log arguments, 'setItemBusyness'
  { item } = transacDoc
  items_.setBusyness item, busy
  .catch _.Error('setItemBusyness')

changeOwnerIfOneWay = (transacDoc)->
  if Transaction.isOneWay transacDoc
    _.log arguments, 'changeOwner'
    { item, requester } = transacDoc
    items_.changeOwner transacDoc
    .catch _.ErrorRethrow('changeOwner')

actions =
  setItemBusyness: setItemBusyness
  changeOwnerIfOneWay: changeOwnerIfOneWay

sideEffects = __.require('sharedLibs', 'transaction_side_effects')(actions, _)
