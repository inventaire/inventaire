// Transactions side effects:
// mainly changing item availability (toggling items' "busy" attribute)
// and moving items between inventories (actually archiving in one and forking in the other)

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const radio = require('lib/radio')
const Transaction = require('models/transaction')
const items_ = require('controllers/items/lib/items')

module.exports = () => radio.on('transaction:update', applySideEffects)

const applySideEffects = (transacDoc, newState) => {
  _.log({ transacDoc, newState }, 'applySideEffects')
  return sideEffects[newState](transacDoc, newState)
}

const setItemBusyness = (busy, transacDoc) => {
  _.log({ busy, transacDoc }, 'setItemBusyness')
  const { item } = transacDoc
  return items_.setBusyness(item, busy)
  .catch(_.Error('setItemBusyness'))
}

const changeOwnerIfOneWay = transacDoc => {
  if (Transaction.isOneWay(transacDoc)) {
    _.log({ transacDoc }, 'changeOwner')
    return items_.changeOwner(transacDoc)
    .catch(_.ErrorRethrow('changeOwner'))
  }
}

const setItemToBusy = _.partial(setItemBusyness, true)
const setItemToNotBusy = _.partial(setItemBusyness, false)

const sideEffects = {
  accepted: setItemToBusy,
  declined: _.noop,
  confirmed: changeOwnerIfOneWay,
  returned: setItemToNotBusy,
  cancelled: setItemToNotBusy
}
