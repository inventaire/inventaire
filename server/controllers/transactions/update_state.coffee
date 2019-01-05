__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
transactions_ = require './lib/transactions'
{ states, statesList } = __.require 'models', 'attributes/transaction'
sanitize = __.require 'lib', 'sanitize/sanitize'
{ Track } = __.require 'lib', 'track'

sanitization =
  transaction: {}
  state:
    whitelist: statesList

module.exports = (req, res, next)->
  sanitize req, res, sanitization
  .then (params)->
    { transaction, state } = req.body
    reqUserId = req.user._id
    transactions_.byId transaction
    .then VerifyRights(state, reqUserId)
    .then transactions_.updateState.bind(null, state, reqUserId)
    .then responses_.Ok(res)
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
