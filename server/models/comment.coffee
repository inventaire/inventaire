CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Comment = {}

Comment.tests = tests = require './tests/comment'

Comment.createItemComment = (userId, message, item)->
  itemId = item._id
  tests.pass 'itemId', itemId

  comment = createComment(userId, message)
  comment.item = itemId
  return comment

Comment.createTransactionComment = (userId, message, transactionId)->
  tests.pass 'transactionId', transactionId

  comment = createComment(userId, message)
  comment.transaction = transactionId
  return comment


createComment = (userId, message)->
  tests.pass 'userId', userId
  tests.pass 'message', message

  return comment =
    user: userId
    message: message
    created: _.now()
