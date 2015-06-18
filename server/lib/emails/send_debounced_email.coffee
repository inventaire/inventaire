CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

transporter_ = require './transporter'
email_ = require './email'
sendTransactionEmail = require './send_transaction_email'

module.exports =
  transactionUpdate: (transactionId)->
    sendTransactionEmail transactionId
    .then transporter_.sendMail
    .catch _.Error('transactionUpdate')