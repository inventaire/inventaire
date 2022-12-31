import error_ from 'lib/error/error'
import responses_ from 'lib/responses'
import transactions_ from './lib/transactions'
import { verifyIsRequester, verifyIsOwner, verifyRightToInteract } from './lib/rights_verification'
import { states, statesList } from 'models/attributes/transaction'
import { sanitize, validateSanitization } from 'lib/sanitize/sanitize'
import { Track } from 'lib/track'

const sanitization = validateSanitization({
  transaction: {},
  state: {
    allowlist: statesList
  }
})

export default (req, res) => {
  const params = sanitize(req, res, sanitization)
  return updateState(params)
  .then(Track(req, [ 'transaction', 'update', params.state ]))
  .then(responses_.Ok(res))
}

const updateState = async ({ transactionId, state, reqUserId }) => {
  const transaction = await transactions_.byId(transactionId)
  validateRights(transaction, state, reqUserId)
  await checkForConcurrentTransactions(transaction, state)
  return transactions_.updateState(transaction, state, reqUserId)
}

const validateRights = (transaction, state, reqUserId) => {
  const { actor } = states[state]
  validateRightsFunctionByAllowedActor[actor](reqUserId, transaction)
}

const validateRightsFunctionByAllowedActor = {
  requester: verifyIsRequester,
  owner: verifyIsOwner,
  both: verifyRightToInteract,
}

const checkForConcurrentTransactions = async (transaction, requestedState) => {
  if (requestedState === 'accepted') {
    // No need to check that the transaction holding the item busy is not the updated transaction
    // as the requested state is 'accepted', which, to be valid, needs to be done on a transaction
    // in a 'requested' state
    const itemIsBusy = await transactions_.itemIsBusy(transaction.item)
    if (itemIsBusy) {
      throw error_.new('item already busy', 403, { transaction, requestedState })
    }
  }
}
