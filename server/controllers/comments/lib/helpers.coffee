CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'

addOwnerId = (owner, users)->
  users.push owner
  return users

removeCommentorId = (commentor, users)->
  return _.without users, commentor


module.exports = (comments_)->

  findUsersToNotify = (itemId, owner, commentor)->
    comments_.findItemCommentors(itemId)
    .then addOwnerId.bind(null, owner)
    .then removeCommentorId.bind(null, commentor)
    .then _.uniq

  helpers_ =
    notifyItemFollowers: (itemId, owner, commentor)->
      findUsersToNotify(itemId, owner, commentor)
      .then Radio.emit.bind(Radio, 'notify:comment:followers', itemId, commentor)

    mapUsers: (comments)->
      comments.map (comment)-> comment.user
