CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ userId, itemId, transactionId } = require './common-tests'

module.exports =
  userId: userId
  itemId: itemId
  transactionId: transactionId
  message: (message)->
    return message.length < 5000
