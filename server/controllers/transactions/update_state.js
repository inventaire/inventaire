import { checkIfItemIsBusy, getTransactionById, updateTransactionState } from '#controllers/transactions/lib/transactions'
import { error_ } from '#lib/error/error'
import { responses_ } from '#lib/responses'
import { sanitize, validateSanitization } from '#lib/sanitize/sanitize'
import { Track } from '#lib/track'
import transactionAttributes from '#models/attributes/transaction'
import { verifyIsRequester, verifyIsOwner, verifyRightToInteractWithTransaction } from './lib/rights_verification.js'

const { states, statesList } = transactionAttributes

const sanitization = validateSanitization({
  transaction: {},
  state: {
    allowlist: statesList,
  },
})

export default (req, res) => {
  const params = sanitize(req, res, sanitization)
  return updateState(params)
  .then(Track(req, [ 'transaction', 'update', params.state ]))
  .then(responses_.Ok(res))
}

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
      throw error_.new('item already busy', 403, { transaction, requestedState })
    }
  }
}
