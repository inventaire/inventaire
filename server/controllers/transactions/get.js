const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const transactions_ = require('./lib/transactions')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .get('reqUserId')
  .then(transactions_.byUser)
  .then(responses_.Wrap(res, 'transactions'))
  .catch(error_.Handler(req, res))
}
