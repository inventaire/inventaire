// Transactions side effects:
// mainly changing item availability (toggling items' "busy" attribute)
// and moving items between inventories (actually archiving in one and forking in the other)

import { noop } from 'lodash-es'
import { changeItemOwner } from '#controllers/items/lib/items'
import { radio } from '#lib/radio'
import { log, LogErrorAndRethrow } from '#lib/utils/logs'
import { transactionIsOneWay } from '#models/transaction'

export function initSideEffects () {
  radio.on('transaction:update', applySideEffects)
}

const applySideEffects = (transacDoc, newState) => {
  log({ transacDoc, newState }, 'applySideEffects')
  return sideEffects[newState](transacDoc, newState)
}

const changeOwnerIfOneWay = transacDoc => {
  if (transactionIsOneWay(transacDoc)) {
    log({ transacDoc }, 'changeOwner')
    return changeItemOwner(transacDoc)
    .catch(LogErrorAndRethrow('changeOwner'))
  }
}

const sideEffects = {
  accepted: noop,
  declined: noop,
  confirmed: changeOwnerIfOneWay,
  returned: noop,
  cancelled: noop,
}
