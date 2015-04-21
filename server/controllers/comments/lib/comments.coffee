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

  create: (userId, message, item)->
    comment = Comment.create(userId, message, item)
    promise = db.post comment

    promise
    .then helpers_.notifyItemFollowers.bind(null, item._id, item.owner, userId)

    return promise

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
