CONFIG = require 'config'
__ = CONFIG.universalPath
{ godMode } = CONFIG
_ = __.require 'builders', 'utils'

module.exports = (actions)->
  API =
    requestFriend: (userId, otherId, status)->
      # useful for development
      if godMode then return actions.forceFriendship userId, otherId
      switch status
        when 'none'
          actions.makeRequest userId, otherId
        when 'otherRequested'
          actions.simultaneousRequest userId, otherId
        else doNothing status, 'requestFriend', userId, otherId

    cancelFriendRequest: (userId, otherId, status)->
      switch status
        when 'userRequested'
          actions.removeRelation userId, otherId
        else doNothing status, 'cancelFriendRequest', userId, otherId

    removeFriendship: (userId, otherId, status)->
      switch status
        when 'friends', 'userRequested', 'otherRequested'
          actions.removeRelation userId, otherId
        else doNothing status, 'removeFriendship', userId, otherId

    acceptRequest: (userId, otherId, status)->
      switch status
        when 'otherRequested'
          actions.acceptRequest userId, otherId
        when 'none'
          _.warn "#{userId} request to #{otherId} accepted after being cancelled"
        else doNothing status, 'acceptRequest', userId, otherId

    discardRequest: (userId, otherId, status)->
      switch status
        when 'otherRequested'
          actions.removeRelation userId, otherId
        else doNothing status, 'discardRequest', userId, otherId

  return API

doNothing = (status, method, userId, otherId)->
  _.warn "Status mismatch: got status '#{status}'
    at #{method} for relation #{userId}, #{otherId}.
    (it happens but it shouldn't be to often).
    Here, doing nothing is the best."
  return
