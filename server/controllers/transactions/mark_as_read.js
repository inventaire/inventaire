// Mark the whole transaction as read

const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const transactions_ = require('./lib/transactions')
const sanitize = require('lib/sanitize/sanitize')
const { verifyRightToInteract } = require('./lib/rights_verification')

const sanitization = {
  id: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(markAsRead)
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const markAsRead = async ({ id, reqUserId }) => {
  const transaction = await transactions_.byId(id)
  verifyRightToInteract(reqUserId, transaction)
  await transactions_.markAsRead(reqUserId, transaction)
}
