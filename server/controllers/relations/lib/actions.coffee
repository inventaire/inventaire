CONFIG = require 'config'
__ = CONFIG.root
queries_ = require './queries'
Radio = __.require 'lib', 'radio'

module.exports =
  acceptRequest: (userId, otherId)->
    queries_.putFriendStatus(userId, otherId)
    Radio.emit 'notify:friend:request:accepted', otherId, userId
  simultaneousRequest: (userId, otherId)->
    queries_.putFriendStatus(userId, otherId)
    Radio.emit 'notify:friend:request:accepted', otherId, userId
    Radio.emit 'notify:friend:request:accepted', userId, otherId
  makeRequest: (userId, otherId, notify=true)->
    # useful to avoid emails when a new user is created with waiting email invitations
    # which are then converted into requests
    if notify then Radio.emit 'notify:friendship:request', otherId, userId
    return queries_.putRequestedStatus(userId, otherId)

  removeRelation: queries_.putNoneStatus
  # used by godMode
  forceFriendship: (userId, otherId)->
    queries_.putFriendStatus(userId, otherId)
