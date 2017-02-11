CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'

module.exports = (userId, authentifiedUserPromise)->
  promises_.all [
    user_.byId userId
    canAccessUserSemiPrivateItems userId, authentifiedUserPromise
  ]
  .spread (user, canAccessUserSemiPrivateItems)->
    users: [ user ]
    semiPrivateAccessRight: canAccessUserSemiPrivateItems
    feedOptions:
      title: user.username
      description: user.bio
      image: user.picture
      queryString: "user=#{user._id}"
      pathname: "inventory/#{user._id}"

canAccessUserSemiPrivateItems = (userId, authentifiedUserPromise)->
  authentifiedUserPromise
  .then (requester)->
    if requester?
      return user_.areFriendsOrGroupCoMembers userId, requester._id
    else
      return false
