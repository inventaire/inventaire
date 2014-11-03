CONFIG = require 'config'
_ = CONFIG.root.require('builders', 'utils')
Promise = require 'bluebird'

graph = require('./base')(CONFIG.graph.social)
_g = graph.utils

# UNI-DIRECTONAL:
# - requested

# BI-DIRECTONAL:
# - friend

relationActions =
  relationStatus: (userId, otherId)->
    [fromUser, fromOther] = [
      @get({s: userId, o: otherId})
      .then _g.pluck.first.predicate

      @get({s: otherId , o: userId})
      .then _g.pluck.first.predicate
    ]

    return Promise.all [fromUser, fromOther]
    .spread (fromUser, fromOther)->
      if fromUser is 'friend' or fromOther is 'friend'
        return 'friend'
      return 'userRequested'  if fromUser is 'requested'
      return 'friendRequested'  if fromOther is 'requested'
      return fromUser or fromOther or 'none'

  requestFriend: (userId, friendId)->
    @relationStatus(userId, friendId)
    .then (status)=>
      switch status
        when 'friendRequested'
          return @acceptRequest(userId, friendId)
        when 'userRequested'
          # noop?
          return
        when 'none'
          return putUserFriendRequest(userId, friendId)
        else throw "got status #{status} at requestFriend"

  acceptRequest: (userId, friendId)->
    @relationStatus(userId, friendId)
    .then (status)->
      if status is 'friendRequested'
        putFriendRelation(userId, friendId)
        .then -> delUserFriendRequest(userId, friendId)
      else
        throw new Error 'tried to accept an inexistant request'


putUserFriendRequest = (userId, friendId)->
  return graph.put userId, 'requested', friendId

delUserFriendRequest = (userId, friendId)->
  return graph.del userId, 'requested', friendId

putFriendRelation = (userId, friendId)->
  return graph.put userId, 'friend', friendId




relationsLists =
  getUserRelationsIds: (userId)->
    [friends, userRequests, othersRequests] = [
      @getUserFriends(userId)
      @getUserRequests(userId)
      @getOthersRequests(userId)
    ]

    return Promise.all([friends, userRequests, othersRequests])
    .spread (friends, userRequests, othersRequests)->
      return {
        friends: friends
        userRequests: userRequests
        othersRequests: othersRequests
      }

  getUserFriends: (userId)->
    query = {s: userId, p: 'friend'}
    return @getBidirectional query

  getOthersRequests: (userId)->
    query = { p: 'requested', o: userId }
    return @get(query).then _g.pluck.subjects

  getUserRequests: (userId)->
    query = {s: userId, p: 'requested'}
    return @get(query).then _g.pluck.objects


module.exports = _.extend graph, relationActions, relationsLists
