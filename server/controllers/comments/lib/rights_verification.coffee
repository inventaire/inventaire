__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
interactions_ = __.require 'lib', 'interactions'

# /!\ is expected to be swallowed in a promise chain
# thus returning either promise or non promise values
exports.verifyRightToWriteOrReadComment = (userId, item)->
  # make sure we get a proper item object
  # as it could otherwise open a privacy breach
  unless item.listing?
    throw error_.new 'missing listing', 500, arguments

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
