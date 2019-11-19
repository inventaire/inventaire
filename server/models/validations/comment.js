// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const { pass, userId, transactionId } = require('./common')

module.exports = {
  pass,
  userId,
  transactionId,
  message: message => message.length > 0 && message.length < 5000
}
