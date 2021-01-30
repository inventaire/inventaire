// Transactions side effects:
// mainly changing item availability (toggling items' "busy" attribute)
// and moving items between inventories (actually archiving in one and forking in the other)

const _ = require('builders/utils')
const radio = require('lib/radio')
const Transaction = require('models/transaction')
const items_ = require('controllers/items/lib/items')

module.exports = () => radio.on('transaction:update', applySideEffects)

const applySideEffects = (transacDoc, newState) => {
  _.log({ transacDoc, newState }, 'applySideEffects')
  return sideEffects[newState](transacDoc, newState)
}

const changeOwnerIfOneWay = transacDoc => {
  if (Transaction.isOneWay(transacDoc)) {
    _.log({ transacDoc }, 'changeOwner')
    return items_.changeOwner(transacDoc)
    .catch(_.ErrorRethrow('changeOwner'))
  }
}

const sideEffects = {
  accepted: _.noop,
  declined: _.noop,
  confirmed: changeOwnerIfOneWay,
  returned: _.noop,
  cancelled: _.noop,
}
