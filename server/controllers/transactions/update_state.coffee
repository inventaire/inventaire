__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
transactions_ = require './lib/transactions'
Transaction = __.require 'models','transaction'
tests = __.require 'models','tests/common-tests'

module.exports = (req, res, next)->
  { id, state } = req.body
  userId = req.user._id

  tests.pass 'transactionId', id

  unless state in Transaction.states
    return error_.bundle res, 'unknown state', 400, id, state

  _.log [id, state], 'update transaction state'

  transactions_.byId id
  .then VerifyRights(state, userId)
  .then transactions_.updateState.bind(null, state)
  .then res.json.bind(res)
  .catch error_.Handler(res)


VerifyRights = (state, userId)->
  if state is 'confirmed'
    transactions_.verifyIsRequester.bind(null, userId)
  else
    transactions_.verifyIsOwner.bind(null, userId)
