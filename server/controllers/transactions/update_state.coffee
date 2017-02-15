__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
transactions_ = require './lib/transactions'
{ states, statesList } = __.require 'models', 'transaction'
tests = __.require 'models','tests/common-tests'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next)->
  { id, state } = req.body
  reqUserId = req.user._id

  tests.pass 'transactionId', id

  unless state in statesList
    return error_.bundle req, res, 'unknown state', 400, id, state

  _.log [id, state], 'update transaction state'

  transactions_.byId id
  .then VerifyRights(state, reqUserId)
  .then transactions_.updateState.bind(null, state, reqUserId)
  .then res.json.bind(res)
  .then Track(req, ['transaction', 'update', state])
  .catch error_.Handler(req, res)

VerifyRights = (state, reqUserId)->
  switch states[state].actor
    when 'requester'
      transactions_.verifyIsRequester.bind(null, reqUserId)
    when 'owner'
      transactions_.verifyIsOwner.bind(null, reqUserId)
    when 'both'
      transactions_.verifyRightToInteract.bind(null, reqUserId)
    else throw error_.new 'unknown actor', 500, arguments
