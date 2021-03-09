const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const transactions_ = require('./lib/transactions')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(({ reqUserId }) => reqUserId)
  .then(transactions_.byUser)
  .then(responses_.Wrap(res, 'transactions'))
  .catch(error_.Handler(req, res))
}
