CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Comment = __.require 'models', 'comment'
error_ = __.require 'lib', 'error/error'

db = __.require('couch', 'base')('comments')

module.exports =
  byId: db.get

  byTransactionId: (transactionId)->
    db.viewByKey 'byTransactionId', transactionId

  addTransactionComment: (userId, message, transactionId)->
    _.assertTypes arguments, 'strings...'
    comment = Comment.createTransactionComment(userId, message, transactionId)
    db.post comment

  update: (newMessage, comment)->
    db.update comment._id, (doc)->
      doc.message = newMessage
      doc.edited = Date.now()
      return doc

  delete: (comment)->
    comment._deleted = true
    db.put comment
