__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
transactions_ = require './lib/transactions'
{ states, statesList } = __.require 'models', 'transaction'
tests = __.require 'models','tests/common-tests'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next)->
  { id, state } = req.body
  userId = req.user._id

  tests.pass 'transactionId', id

  unless state in statesList
    return error_.bundle req, res, 'unknown state', 400, id, state

  _.log [id, state], 'update transaction state'

  transactions_.byId id
  .then VerifyRights(state, userId)
  .then transactions_.updateState.bind(null, state, userId)
  .then res.json.bind(res)
  .then Track(req, ['transaction', 'update', state])
  .catch error_.Handler(req, res)

VerifyRights = (state, userId)->
  switch states[state].actor
    when 'requester'
      transactions_.verifyIsRequester.bind(null, userId)
    when 'owner'
      transactions_.verifyIsOwner.bind(null, userId)
    when 'both'
      transactions_.verifyRightToInteract.bind(null, userId)
    else throw error_.new 'unknown actor', 500, arguments
