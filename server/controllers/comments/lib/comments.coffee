CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Comment = __.require 'models', 'comment'
error_ = __.require 'lib', 'error/error'
Radio = __.require 'lib', 'radio'

db = __.require('couch', 'base')('comments')

module.exports = comments_ =
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
    promise = db.post comment

    promise
    .then notifyItemFollowers.bind(null, item._id, item.owner, userId)

    return promise

  update: (newMessage, comment)->
    db.update comment._id, (doc)->
      doc.message = newMessage
      doc.edited = _.now()
      return doc

  delete: (comment)->
    comment._deleted = true
    db.put comment

comments_.findItemCommentors = (itemId)->
  comments_.byItemId(itemId)
  .then mapUsers

mapUsers = (comments)->
  comments.map (comment)-> comment.user

notifyItemFollowers = (itemId, owner, commentor)->
  findUsersToNotify(itemId, owner, commentor)
  .then Radio.emit.bind(Radio, 'notify:comment:followers', itemId, commentor)

findUsersToNotify = (itemId, owner, commentor)->
  comments_.findItemCommentors(itemId)
  .then addOwnerId.bind(null, owner)
  .then removeCommentorId.bind(null, commentor)
  .then _.uniq

addOwnerId = (owner, users)->
  users.push owner
  return users

removeCommentorId = (commentor, users)->
  return _.without users, commentor
