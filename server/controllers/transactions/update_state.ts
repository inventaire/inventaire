import { checkIfItemIsBusy, getTransactionById, updateTransactionState } from '#controllers/transactions/lib/transactions'
import { newError } from '#lib/error/error'
import { track } from '#lib/track'
import { transactionStates, transactionStatesList } from '#models/attributes/transaction'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { Req } from '#types/server'
import { verifyIsRequester, verifyIsOwner, verifyRightToInteractWithTransaction } from './lib/rights_verification.js'

const sanitization = {
  transaction: {},
  state: {
    allowlist: transactionStatesList,
  },
}

async function controller (params: SanitizedParameters, req: Req) {
  const { transactionId, state, reqUserId } = params
  await updateState({ transactionId, state, reqUserId })
  const transaction = await getTransactionById(params.transaction)
  track(req, [ 'transaction', 'update', params.state ])
  return { ok: true, transaction }
}

export default { sanitization, controller }

async function updateState ({ transactionId, state, reqUserId }) {
  const transaction = await getTransactionById(transactionId)
  validateRights(transaction, state, reqUserId)
  await checkForConcurrentTransactions(transaction, state)
  return updateTransactionState(transaction, state, reqUserId)
}

function validateRights (transaction, state, reqUserId) {
  const { actor } = transactionStates[state]
  validateRightsFunctionByAllowedActor[actor](reqUserId, transaction)
}

const validateRightsFunctionByAllowedActor = {
  requester: verifyIsRequester,
  owner: verifyIsOwner,
  both: verifyRightToInteractWithTransaction,
}

async function checkForConcurrentTransactions (transaction, requestedState) {
  if (requestedState === 'accepted') {
    // No need to check that the transaction holding the item busy is not the updated transaction
    // as the requested state is 'accepted', which, to be valid, needs to be done on a transaction
    // in a 'requested' state
    const itemIsBusy = await checkIfItemIsBusy(transaction.item)
    if (itemIsBusy) {
      throw newError('item already busy', 403, { transaction, requestedState })
    }
  }
}
