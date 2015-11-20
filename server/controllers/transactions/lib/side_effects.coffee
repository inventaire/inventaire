# Transactions side effects:
# mainly changing item availability (toggling items' "busy" attribute)
# and moving items between inventories (actually archiving in one and forking in the other)

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'
Transaction = __.require 'models', 'transaction'
items_ = __.require 'controllers', 'items/lib/items'

module.exports = ->
  Radio.on 'transaction:update', applySideEffects

applySideEffects = (transacDoc, newState)->
  _.log arguments, 'applySideEffects'
  sideEffects[newState](transacDoc, newState)

setItemBusyness = (busy, transacDoc)->
  _.log arguments, 'setItemBusyness'
  { item } = transacDoc
  items_.setBusyness item, busy
  .catch _.Error('setItemBusyness')

setItemToBusy = _.partial setItemBusyness, true
setItemToNotBusy = _.partial setItemBusyness, false

moveItemToItsNewInventory = (transacDoc)->
  _.log arguments, 'moveItemToItsNewInventory'
  { item, requester } = transacDoc
  items_.fork item, {owner: requester}
  .then items_.archive.bind(null, item)
  .catch _.Error('moveItemToItsNewInventory')

sideEffects =
  accepted: setItemToBusy
  declined: _.noop
  confirmed: (transacDoc)->
    if Transaction.isOneWay(transacDoc)
      moveItemToItsNewInventory(transacDoc)
  returned: setItemToNotBusy
  cancelled: setItemToNotBusy

