CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'

# Working around the circular dependency
groups_ = null
user_ = null
lateRequire = ->
  groups_ = require './groups'
  user_ = __.require 'controllers', 'user/lib/user'
setTimeout lateRequire, 0

module.exports = (fnName, fnArgs, reqUserId)->
  assert_.array fnArgs
  groups_[fnName].apply null, fnArgs
  .then (group)->
    unless group? then throw error_.notFound groupId

    usersIds = groups_.allGroupMembers group

    user_.getUsersByIds usersIds, reqUserId
    .then (users)-> { group, users }
