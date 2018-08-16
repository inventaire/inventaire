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
    _.types arguments, 'strings...'
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

  deleteByItemsIds: (itemsIds)->
    # You absolutly don't want this id to be undefined
    # as this would end up deleting the whole database
    _.types itemsIds, 'strings...'
    comments_.byItemsIds itemsIds
    .then db.bulkDelete

  deleteItemsCommentsByUserId: (userId)->
    # You absolutly don't want this id to be undefined
    # as this would end up deleting the whole database
    _.type userId, 'string'
    comments_.bySubjectAndUserId 'item', userId
    .then db.bulkDelete
