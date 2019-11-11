// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const transactions_ = require('./lib/transactions')
const { states, statesList } = __.require('models', 'attributes/transaction')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { Track } = __.require('lib', 'track')

const sanitization = {
  transaction: {},
  state: {
    whitelist: statesList
  }
}

module.exports = (req, res, next) => sanitize(req, res, sanitization)
.then((params) => {
  const { transaction, state } = req.body
  const reqUserId = req.user._id
  return transactions_.byId(transaction)
  .then(VerifyRights(state, reqUserId))
  .then(transactions_.updateState.bind(null, state, reqUserId))
  .then(Track(req, [ 'transaction', 'update', state ]))}).then(responses_.Ok(res))
.catch(error_.Handler(req, res))

var VerifyRights = function(state, reqUserId){
  switch (states[state].actor) {
  case 'requester':
    return transactions_.verifyIsRequester.bind(null, reqUserId)
  case 'owner':
    return transactions_.verifyIsOwner.bind(null, reqUserId)
  case 'both':
    return transactions_.verifyRightToInteract.bind(null, reqUserId)
  default: throw error_.new('unknown actor', 500, arguments)
  }
}
