// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// mark the whole transaction as read

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const validations = __.require('models', 'validations/common')
const transactions_ = require('./lib/transactions')

module.exports = function(req, res, next){
  const { id } = req.body
  validations.pass('transactionId', id)
  const reqUserId = req.user._id

  return transactions_.byId(id)
  .then(transactions_.verifyRightToInteract.bind(null, reqUserId))
  .then(transactions_.markAsRead.bind(null, reqUserId))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}
