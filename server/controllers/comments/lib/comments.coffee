CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Comment = __.require 'models', 'comment'
error_ = __.require 'lib', 'error/error'
radio = __.require 'lib', 'radio'

db = __.require('couch', 'base')('comments')

rightsVerification = require './rights_verification'

module.exports = comments_ = {}

# helpers_ depends on comments_ which aslo depends on helpers_
# thus this splitted comments_ definition
helpers_ = require('./helpers')(comments_)

_.extend comments_, rightsVerification,
  byId: db.get
  byItemId: (itemId)->
    db.viewByKey 'byItemId', itemId

  byItemsIds: (itemsIds)->
    _.type itemsIds, 'array'
    db.viewByKeys 'byItemId', itemsIds

  byTransactionId: (transactionId)->
    db.viewByKey 'byTransactionId', transactionId

  bySubjectAndUserId: (subject, userId)->
    # subject: either item or transaction
    db.viewByKey 'bySubjectAndUserId', [ subject, userId ]

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
      doc.edited = Date.now()
      return doc

  delete: (comment)->
    comment._deleted = true
    db.put comment

  findItemCommentors: (itemId)->
    comments_.byItemId itemId
    .map _.property('user')

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
