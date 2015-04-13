__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'


module.exports = (userId, item)->
  {owner, listing} = item

  # the owner of the item is always allowed to comment
  if owner = userId then return item

  switch listing
    # anyone can comment on a public item
    when 'public' then return item
    # friends only can comment on a friends item
    when 'friends' then return ifUserAreFriends(userId, item)
    # anyone can comment on a public item
    when 'private' then commentForbidden(userId, item)



ifUserAreFriends = (userId, item)->
  user_.areFriends(userId, item)
  .then (bool)->
    if bool then return item
    else commentForbidden(userId, item)

commentForbidden = (userId, item)->
  throw error_.new "not allowed to comment on this item", 403, userId, item
