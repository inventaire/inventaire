CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
Group = __.require 'models', 'group'

module.exports = (groups_)->
  userInGroup: (userId, groupId)->
    groups_.byId groupId
    .then groups_.allGroupMembers
    .then userIdInUsers.bind(null, userId)

  userInGroupOrOut: (userId, groupId)->
    groups_.byId groupId
    .then groups_.allGroupUsers
    .then userIdInUsers.bind(null, userId)

  userInRequested: (userId, groupId)->
    groups_.byId groupId
    .then groups_.allRequested
    .then userIdInUsers.bind(null, userId)

  userInAdmins: (userId, groupId)->
    groups_.byId groupId
    .then groups_.allAdmins
    .then userIdInUsers.bind(null, userId)

  allGroupsMembers: (groups)->
    return _(groups).map(groups_.allGroupMembers).flatten().value()

  allAdmins: (group)->
    groups_.usersIdsByAgregatedCategories group, ['admins']

  allGroupMembers: (group)->
    groups_.usersIdsByAgregatedCategories group, Group.categories.members

  allGroupUsers: (group)->
    groups_.usersIdsByAgregatedCategories group, Group.categories.users

  allRequested: (group)->
    groups_.usersIdsByAgregatedCategories group, ['requested']

  usersIdsByAgregatedCategories: (group, categories)->
    _.type categories, 'array'
    _(group).pick(categories).values().flatten()
    .map _.property('user')
    .value()

userIdInUsers = (userId, users)-> userId in users