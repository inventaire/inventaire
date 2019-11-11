CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

transporter_ = require './transporter'
email_ = require './email'
sendTransactionEmail = require './send_transaction_email'
helpers_ = require './helpers'
promises_ = __.require 'lib', 'promises'

module.exports =
  transactionUpdate: (transactionId)->
    sendTransactionEmail transactionId
    .then transporter_.sendMail
    .catch helpers_.catchDisabledEmails
    .catch promises_.catchSkip('send_transaction_email')
    .catch _.Error('transactionUpdate')
