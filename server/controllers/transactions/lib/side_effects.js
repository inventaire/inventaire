// Transactions side effects:
// mainly changing item availability (toggling items' "busy" attribute)
// and moving items between inventories (actually archiving in one and forking in the other)

import _ from '#builders/utils'
import { changeItemOwner } from '#controllers/items/lib/items'
import { radio } from '#lib/radio'
import { log, LogErrorAndRethrow } from '#lib/utils/logs'
import Transaction from '#models/transaction'

export function initSideEffects () {
  radio.on('transaction:update', applySideEffects)
}

const applySideEffects = (transacDoc, newState) => {
  log({ transacDoc, newState }, 'applySideEffects')
  return sideEffects[newState](transacDoc, newState)
}

const changeOwnerIfOneWay = transacDoc => {
  if (Transaction.isOneWay(transacDoc)) {
    log({ transacDoc }, 'changeOwner')
    return changeItemOwner(transacDoc)
    .catch(LogErrorAndRethrow('changeOwner'))
  }
}

const sideEffects = {
  accepted: _.noop,
  declined: _.noop,
  confirmed: changeOwnerIfOneWay,
  returned: _.noop,
  cancelled: _.noop,
}
