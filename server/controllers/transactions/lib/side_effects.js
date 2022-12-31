// Transactions side effects:
// mainly changing item availability (toggling items' "busy" attribute)
// and moving items between inventories (actually archiving in one and forking in the other)

import _ from 'builders/utils'

import radio from 'lib/radio'
import Transaction from 'models/transaction'
import items_ from 'controllers/items/lib/items'

export default () => radio.on('transaction:update', applySideEffects)

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
