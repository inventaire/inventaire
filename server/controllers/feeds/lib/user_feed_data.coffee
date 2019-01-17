CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'

module.exports = (userId, authentifiedUserPromise)->
  promises_.all [
    user_.byId userId
    getAccessLevel userId, authentifiedUserPromise
  ]
  .spread (user, getAccessLevel)->
    users: [ user ]
    accessLevel: getAccessLevel
    feedOptions:
      title: user.username
      description: user.bio
      image: user.picture
      queryString: "user=#{user._id}"
      pathname: "inventory/#{user._id}"

getAccessLevel = (userId, authentifiedUserPromise)->
  authentifiedUserPromise
  .then (requester)->
    unless requester? then return 'public'

    requesterId = requester._id

    if requesterId is userId then return 'private'

    user_.areFriendsOrGroupCoMembers userId, requester._id
    .then (bool)-> if bool then 'network' else 'public'
