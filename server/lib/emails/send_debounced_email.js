const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const transporter_ = require('./transporter')
const sendTransactionEmail = require('./send_transaction_email')
const helpers_ = require('./helpers')
const promises_ = __.require('lib', 'promises')

module.exports = {
  transactionUpdate: transactionId => {
    return sendTransactionEmail(transactionId)
    .then(transporter_.sendMail)
    .catch(helpers_.catchDisabledEmails)
    .catch(promises_.catchSkip('send_transaction_email'))
    .catch(_.Error('transactionUpdate'))
  }
}
