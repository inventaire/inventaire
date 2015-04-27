CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Comment = {}

Comment.tests = tests = require './tests/comment'

Comment.createItemComment = (userId, message, item)->
  itemId = item._id
  passTest 'itemId', itemId

  comment = createComment(userId, message)
  comment.item = itemId
  return comment

Comment.createTransactionComment = (userId, message, transactionId)->
  passTest 'transactionId', transactionId

  comment = createComment(userId, message)
  comment.transaction = transactionId
  return comment


createComment = (userId, message)->
  passTest 'userId', userId
  passTest 'message', message

  return comment =
    user: userId
    message: message
    created: _.now()


passTest = (attribute, value)->
  unless tests[attribute](value)
    throw error_.new "invalid #{attribute}: #{value}", 400
