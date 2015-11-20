__ = require('config').universalPath
_ = __.require 'builders', 'utils'
interactions_ = __.require 'lib', 'interactions'
error_ = __.require 'lib', 'error/error'

module.exports =
  verifyRightToRequest: (requester, item)->
    # the owner of the item isnt allowed to request it
    ownerAllowed = false
    interactions_.verifyRightToInteract(requester, item, ownerAllowed)

  verifyRightToInteract: (userId, transaction)->
    { _id, owner, requester } = transaction
    if userId is owner or userId is requester then return transaction
    else throw error_.new 'wrong user', 403, userId, transaction

  verifyIsOwner: (userId, transaction)->
    { owner } = transaction
    if userId is owner then return transaction
    else throw error_.new 'wrong user', 403, userId, transaction

  verifyIsRequester: (userId, transaction)->
    { requester } = transaction
    if userId is requester then return transaction
    else throw error_.new 'wrong user', 403, userId, transaction
