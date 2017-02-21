CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'controllers', 'user/lib/user'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'

module.exports = (groups_)->
  return getGroupPublicData = (groupId)->
    groups_.byId groupId
    .then (group)->
      unless group? then throw error_.notFound groupId

      usersIds = groups_.allGroupMembers group

      user_.getUsersPublicData usersIds
      .then (users)-> { group, users }
