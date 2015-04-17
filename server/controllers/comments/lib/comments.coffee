CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Comment = __.require 'models', 'comment'
error_ = __.require 'lib', 'error/error'


db = __.require('couch', 'base')('comments')

module.exports =
  byId: db.get.bind(db)
  byItemId: (itemId)->
    db.viewByKey 'byItemId', itemId

  verifyRightToComment: require './verify_right_to_comment'
  verifyEditRight: (userId, comment)->
    if comment.user is userId then return comment
    else throw error_.new 'wrong user', 403, userId, comment

  verifyDeleteRight: (userId, comment, item)->
    if comment.user is userId then return comment
    else if item.owner is userId then return comment
    else throw error_.new 'wrong user', 403, userId, comment, item

  create: (userId, message, item)->
    comment = Comment.create(userId, message, item)
    db.post comment

  update: (newMessage, comment)->
    db.update comment._id, (doc)->
      doc.message = newMessage
      return doc

  delete: (comment)->
    comment._deleted = true
    db.put comment
