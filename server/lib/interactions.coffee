__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'

# MUST return the item or throw an error
exports.verifyRightToInteract = (userId, item, ownerAllowed)->
  { owner, listing } = item

  # item owner right to interact depends on the interaction
  # ex: comment-> allowed, request-> not allowed
  if owner is userId
    if ownerAllowed then return item
    else forbidden userId, item

  switch listing
    # anyone can interact on a public item
    when 'public' then return item
    # network users only can interact on a network item
    when 'network' then return ifUserAreFriendsOrGroup userId, owner, item
    # no one can interact on a private item
    when 'private' then forbidden userId, item

ifUserAreFriendsOrGroup = (userId, owner, item)->
  user_.areFriendsOrGroupCoMembers(userId, owner)
  .then (bool)->
    if bool then return item
    else forbidden userId, item

forbidden = (userId, item)->
  throw error_.new 'not allowed with this item', 403, userId, item
