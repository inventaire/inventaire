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
    const { transaction, state } = req.body
    const reqUserId = req.user._id
    return transactions_.byId(transaction)
    .then(VerifyRights(state, reqUserId))
    .then(transactions_.updateState.bind(null, state, reqUserId))
    .then(Track(req, [ 'transaction', 'update', state ]))
  })
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const VerifyRights = (state, reqUserId) => {
  const { actor } = states[state]
  if (actor === 'requester') return verifyIsRequester.bind(null, reqUserId)
  else if (actor === 'owner') return verifyIsOwner.bind(null, reqUserId)
  else if (actor === 'both') return verifyRightToInteract.bind(null, reqUserId)
  else throw error_.new('unknown actor', 500, { state, reqUserId })
}
