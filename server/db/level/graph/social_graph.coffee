CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')
Promise = require 'bluebird'

Radio = __.require 'lib', 'radio'

graph = require('./base')('social_graph', true)
graph_ = graph.utils

# UNI-DIRECTONAL:
# - requested

# BI-DIRECTONAL:
# - friend

relationActions =
  relationStatus: (userId, otherId)->
    [fromUser, fromOther] = [
      @get({s: userId, o: otherId})
      .then graph_.pluck.first.predicate

      @get({s: otherId , o: userId})
      .then graph_.pluck.first.predicate
    ]

    return Promise.all [fromUser, fromOther]
    .spread (fromUser, fromOther)->
      _.info [fromUser, fromOther], 'current relation statuses'
      if fromUser is 'friend' or fromOther is 'friend'
        return 'friend'
      return 'userRequested'  if fromUser is 'requested'
      return 'friendRequested'  if fromOther is 'requested'
      return fromUser or fromOther or 'none'

  requestFriend: (userId, friendId)->
    @relationStatus(userId, friendId)
    .then (status)=>
      switch status
        when 'userRequested'
          _.warn [userId, friendId], 'user request already exist'
          return
        when 'friendRequested'
          return @acceptRequest(userId, friendId)
        when 'none'
          if CONFIG.godMode then putFriendRelation(userId, friendId)
          else putUserFriendRequest(userId, friendId)
        else throw "got status #{status} at requestFriend"

  cancelFriendRequest: (userId, friendId)->
    @relationStatus(userId, friendId)
    .then (status)=>
      switch status
        when 'userRequested'
          return delUserFriendRequest(userId, friendId)
        else throw "got status #{status} at cancelFriendRequest"

  removeFriendship: (userId, friendId)->
    @relationStatus(userId, friendId)
    .then (status)=>
      switch status
        when 'friend' then return delFriendship(userId, friendId)
        else throw "got status #{status} at removeFriendship"

  acceptRequest: (userId, friendId)->
    @relationStatus(userId, friendId)
    .then (status)->
      switch status
        when 'friendRequested'
          putFriendRelation(userId, friendId)
          .then ->
            delUserFriendRequest(friendId, userId)
            Radio.emit 'notify:friend:request:accepted', friendId, userId
        when 'none'
          warn = 'user request accepted after being cancelled'
          _.warn [userId, friendId], warn
          return
        else throw "got status #{status} at acceptRequest"

  discardRequest: (userId, friendId)->
    @relationStatus(userId, friendId)
    .then (status)->
      switch status
        when 'friendRequested'
          return delUserFriendRequest(friendId, userId)
        else throw "got status #{status} at discardRequest"

putUserFriendRequest = (userId, friendId)->
  return graph.put userId, 'requested', friendId

putFriendRelation = (userId, friendId)->
  return graph.put userId, 'friend', friendId

delUserFriendRequest = (userId, friendId)->
  return graph.del userId, 'requested', friendId

delFriendship = (userId, friendId)->
  return graph.delBidirectional userId, 'friend', friendId


relationsLists =
  getUserRelations: (userId)->
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
    return @get(query).then graph_.pluck.subjects

  getUserRequests: (userId)->
    query = {s: userId, p: 'requested'}
    return @get(query).then graph_.pluck.objects


module.exports = _.extend graph, relationActions, relationsLists
