const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const transactions_ = require('./lib/transactions')
const { verifyIsRequester, verifyIsOwner, verifyRightToInteract } = require('./lib/rights_verification')
const { states, statesList } = require('models/attributes/transaction')
const sanitize = require('lib/sanitize/sanitize')
const { Track } = require('lib/track')

const sanitization = {
  transaction: {},
  state: {
    allowlist: statesList
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    return updateState(params)
    .then(Track(req, [ 'transaction', 'update', params.state ]))
  })
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const updateState = async ({ transactionId, state, reqUserId }) => {
  const transaction = await transactions_.byId(transactionId)
  verifyRights(transaction, state, reqUserId)
  await checkForConcurrentTransactions(transaction, state)
  return transactions_.updateState(transaction, state, reqUserId)
}

const verifyRights = (transaction, state, reqUserId) => {
  const { actor } = states[state]
  verifyRightsFunctionByAllowedActor[actor](reqUserId, transaction)
}

const verifyRightsFunctionByAllowedActor = {
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
