CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'controllers', 'user/lib/user'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'

module.exports = (groups_)->
  return getGroupData = (fnName, fnArgs, reqUserId)->
    assert_.array fnArgs
    groups_[fnName].apply null, fnArgs
    .then (group)->
      unless group? then throw error_.notFound groupId

      usersIds = groups_.allGroupMembers group

      user_.getUsersByIds usersIds, reqUserId
      .then (users)-> { group, users }
