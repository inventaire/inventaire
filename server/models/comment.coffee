CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Comment = {}

Comment.tests = tests = require './tests/comment'

Comment.create = (userId, message, item)->
  itemId = item._id

  unless tests.userId(userId)
    throw error_.new "invalid userId: #{userId}", 400

  unless tests.itemId(itemId)
    throw error_.new "invalid itemId: #{itemId}", 400

  unless tests.message(message)
    throw error_.new "message is too long: #{message}", 400

  return comment =
    type: 'comment'
    user: userId
    item: itemId
    message: message
    created: _.now()
