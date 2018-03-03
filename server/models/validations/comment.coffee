CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, userId, itemId, transactionId } = require './common'

module.exports = {
  pass,
  userId,
  itemId,
  transactionId,
  message: (message)-> 0 < message.length < 5000
}
