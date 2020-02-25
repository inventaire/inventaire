const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const transporter_ = require('./transporter')
const buildTransactionEmail = require('./build_transaction_email')
const helpers_ = require('./helpers')

module.exports = {
  transactionUpdate: async transactionId => {
    const email = await buildTransactionEmail(transactionId)
    if (!email) return

    transporter_.sendMail(email)
    .catch(helpers_.catchDisabledEmails)
    .catch(_.Error('transactionUpdate'))
  }
}
