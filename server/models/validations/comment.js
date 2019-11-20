
const { pass, userId, transactionId } = require('./common')

module.exports = {
  pass,
  userId,
  transactionId,
  message: message => message.length > 0 && message.length < 5000
}
