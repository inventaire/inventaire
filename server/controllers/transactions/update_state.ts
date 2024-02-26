import { checkIfItemIsBusy, getTransactionById, updateTransactionState } from '#controllers/transactions/lib/transactions'
import { newError } from '#lib/error/error'
import { track } from '#lib/track'
import transactionAttributes from '#models/attributes/transaction'
import { verifyIsRequester, verifyIsOwner, verifyRightToInteractWithTransaction } from './lib/rights_verification.js'

const { states, statesList } = transactionAttributes

const sanitization = {
  transaction: {},
  state: {
    allowlist: statesList,
  },
}

async function controller (params, req) {
  await updateState(params)
  const transaction = await getTransactionById(params.transaction)
  track(req, [ 'transaction', 'update', params.state ])
  return { ok: true, transaction }
}

export default { sanitization, controller }

const updateState = async ({ transactionId, state, reqUserId }) => {
  const transaction = await getTransactionById(transactionId)
  validateRights(transaction, state, reqUserId)
  await checkForConcurrentTransactions(transaction, state)
  return updateTransactionState(transaction, state, reqUserId)
}

const validateRights = (transaction, state, reqUserId) => {
  const { actor } = states[state]
  validateRightsFunctionByAllowedActor[actor](reqUserId, transaction)
}

const validateRightsFunctionByAllowedActor = {
  requester: verifyIsRequester,
  owner: verifyIsOwner,
  both: verifyRightToInteractWithTransaction,
}

const checkForConcurrentTransactions = async (transaction, requestedState) => {
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
