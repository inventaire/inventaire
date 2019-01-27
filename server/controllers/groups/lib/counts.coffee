CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

# Working around the circular dependency
groups_ = null
lateRequire = -> groups_ = require './groups'
setTimeout lateRequire, 0

module.exports =
  pendingGroupInvitationsCount: (userId)->
    groups_.byInvitedUser userId
    .get 'length'

  pendingGroupRequestsCount: (userId)->
    groups_.byAdmin userId
    .then (groups)-> _.sum groups.map(_.property('requested.length'))
