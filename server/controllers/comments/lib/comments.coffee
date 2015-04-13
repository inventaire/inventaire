CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Comment = __.require 'models', 'comment'
error_ = __.require 'lib', 'error/error'


db = __.require('couch', 'base')('comments')

module.exports =
  byItemId: (itemId)->
    db.viewByKey 'byItemId', itemId

  verifyRightToComment: require './verify_right_to_comment'

  createComment: (userId, message, item)->
    comment = Comment.create(userId, message, item)
    db.post comment
