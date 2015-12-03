CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'

module.exports = (groups_)->

  getGroupPublicData = (groupId)->
    groups_.byId groupId
    .then (group)->
      getUsersAndItems(group)
      .spread (users, items)->
        group: group
        users: users
        items: items

  getUsersAndItems = (group)->
    usersIds = groups_.allGroupMembers group
    promises_.all [
      user_.getUsersPublicData(usersIds)
      items_.bundleListings(['public'], usersIds)
    ]

  return getGroupPublicData
