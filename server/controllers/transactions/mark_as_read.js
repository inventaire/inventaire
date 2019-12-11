// mark the whole transaction as read

const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const validations = __.require('models', 'validations/common')
const transactions_ = require('./lib/transactions')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  id: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { id } = params
    validations.pass('transactionId', id)
    const reqUserId = req.user._id

    return transactions_.byId(id)
    .then(transactions_.verifyRightToInteract.bind(null, reqUserId))
    .then(transactions_.markAsRead.bind(null, reqUserId))
    .then(responses_.Ok(res))
  })
  .catch(error_.Handler(req, res))
}
