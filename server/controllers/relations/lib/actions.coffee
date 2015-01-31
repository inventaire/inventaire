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
  makeRequest: queries_.putRequestedStatus
  removeRelation: queries_.putNoneStatus
