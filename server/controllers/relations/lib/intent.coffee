CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

queries = require './queries'
actions = require './actions'
solve = require('./solve_intent')(actions)

module.exports =
  requestFriend: (userId, otherId)->
    queries.getStatus(userId, otherId)
    .then solve.requestFriend.bind(null, userId, otherId)

  cancelFriendRequest: (userId, otherId)->
    queries.getStatus(userId, otherId)
    .then solve.cancelFriendRequest.bind(null, userId, otherId)

  removeFriendship: (userId, otherId)->
    queries.getStatus(userId, otherId)
    .then solve.removeFriendship.bind(null, userId, otherId)

  acceptRequest: (userId, otherId)->
    queries.getStatus(userId, otherId)
    .then solve.acceptRequest.bind(null, userId, otherId)

  discardRequest: (userId, otherId)->
    queries.getStatus(userId, otherId)
    .then solve.discardRequest.bind(null, userId, otherId)
