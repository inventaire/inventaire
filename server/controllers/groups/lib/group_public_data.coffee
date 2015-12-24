CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'controllers', 'items/lib/items'

module.exports = (groups_)->

  getGroupPublicData = (groupId)->
    groups_.byId groupId
    .then (group)->
      if emptyGroup group
        return promises_.resolve objectRes(group)

      getUsersAndItems group
      .spread objectRes.bind(null, group)

  getUsersAndItems = (group)->
    usersIds = groups_.allGroupMembers group
    promises_.all [
      user_.getUsersPublicData(usersIds)
      items_.bundleListings(['public'], usersIds)
    ]

  return getGroupPublicData

objectRes = (group, users=[], items=[])->
  group: group
  users: users
  items: items

# When a user is alone in a group
# she can leave the group and let it with 0 admins
# But the group isn't destroyed and might still be queried for notifications
emptyGroup = (group)-> group.admins.length is 0
