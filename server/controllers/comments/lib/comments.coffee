CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Comment = __.require 'models', 'comment'
error_ = __.require 'lib', 'error/error'
Radio = __.require 'lib', 'radio'

db = __.require('couch', 'base')('comments')

rightsVerification = require './rights_verification'

module.exports = comments_ = {}

# helpers_ depends on comments_ which aslo depends on helpers_
# thus this splitted comments_ definition
helpers_ = require('./helpers')(comments_)

_.extend comments_, rightsVerification,
  byId: db.get.bind(db)
  byItemId: (itemId)->
    db.viewByKey 'byItemId', itemId

  byTransactionId: (transactionId)->
    db.viewByKey 'byTransactionId', transactionId

  addItemComment: (userId, message, item)->
    _.types arguments, ['string', 'string', 'object']
    comment = Comment.createItemComment(userId, message, item)
    promise = db.post comment

    promise
    .then helpers_.notifyItemFollowers.bind(null, item._id, item.owner, userId)

    return promise

  addTransactionComment: (userId, message, transactionId)->
    _.types arguments, 'strings...'
    comment = Comment.createTransactionComment(userId, message, transactionId)
    db.post comment

  update: (newMessage, comment)->
    db.update comment._id, (doc)->
      doc.message = newMessage
      doc.edited = _.now()
      return doc

  delete: (comment)->
    comment._deleted = true
    db.put comment

  findItemCommentors: (itemId)->
    comments_.byItemId(itemId)
    .then helpers_.mapUsers
