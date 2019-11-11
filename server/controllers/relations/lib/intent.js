CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

queries = require './queries'
actions = require './actions'
solve = require('./solve_intent')(actions)

module.exports =
  requestFriend: (reqUserId, otherId)->
    queries.getStatus reqUserId, otherId
    .then solve.requestFriend.bind(null, reqUserId, otherId)

  cancelFriendRequest: (reqUserId, otherId)->
    queries.getStatus reqUserId, otherId
    .then solve.cancelFriendRequest.bind(null, reqUserId, otherId)

  removeFriendship: (reqUserId, otherId)->
    queries.getStatus reqUserId, otherId
    .then solve.removeFriendship.bind(null, reqUserId, otherId)

  acceptRequest: (reqUserId, otherId)->
    queries.getStatus reqUserId, otherId
    .then solve.acceptRequest.bind(null, reqUserId, otherId)

  discardRequest: (reqUserId, otherId)->
    queries.getStatus reqUserId, otherId
    .then solve.discardRequest.bind(null, reqUserId, otherId)
