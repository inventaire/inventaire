CONFIG = require 'config'
__ = CONFIG.universalPath
error_ = __.require 'lib', 'error/error'

module.exports = Comment = {}

Comment.validations = validations = require './validations/comment'

Comment.createTransactionComment = (userId, message, transactionId)->
  validations.pass 'transactionId', transactionId
  createComment userId, message, 'transaction', transactionId

createComment = (userId, message, key, value)->
  validations.pass 'userId', userId
  validations.pass 'message', message

  comment =
    user: userId
    message: message
    created: Date.now()

  # the key identifies the object to which the comment is attached
  comment[key] = value

  return comment
