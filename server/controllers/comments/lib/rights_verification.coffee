__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'
interactions_ = __.require 'lib', 'interactions'

exports.verifyRightToComment = (userId, item)->
  # the owner of the item is always allowed to comment
  ownerAllowed = true
  interactions_.verifyRightToInteract(userId, item, ownerAllowed)

exports.verifyEditRight = (userId, comment)->
  if comment.user is userId then return comment
  else throw error_.new 'wrong user', 403, userId, comment

exports.verifyDeleteRight = (userId, comment, item)->
  if comment.user is userId then return comment
  else if item.owner is userId then return comment
  else throw error_.new 'wrong user', 403, userId, comment, item
