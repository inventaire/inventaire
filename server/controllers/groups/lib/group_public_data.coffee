CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'

module.exports = (groups_)->

  getGroupPublicData = (groupId)->
    groups_.byId groupId
    .then (group)->
      unless group? then throw error_.notFound groupId

      getUsersAndItems group
      .spread objectRes.bind(null, group)

  getUsersAndItems = (group)->
    usersIds = groups_.allGroupMembers group
    promises_.all [
      user_.getUsersPublicData(usersIds)
      items_.publicListings(usersIds)
    ]

  return getGroupPublicData

objectRes = (group, users=[], items=[])-> { group, users, items }
