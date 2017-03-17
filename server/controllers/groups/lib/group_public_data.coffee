CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'controllers', 'user/lib/user'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'

module.exports = (groups_)->
  return getGroupData = (fnName, fnArg, reqUserId)->
    groups_[fnName](fnArg)
    .then (group)->
      unless group? then throw error_.notFound groupId

      usersIds = groups_.allGroupMembers group

      user_.getUsersData reqUserId, usersIds
      .then (users)-> { group, users }
