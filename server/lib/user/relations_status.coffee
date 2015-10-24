CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
groups_ = __.require 'controllers', 'groups/lib/groups'
relations_ = __.require 'controllers', 'relations/lib/queries'
promises_ = __.require 'lib', 'promises'

module.exports =
  getUserRelations: (userId, getDocs)->
    # just proxiing to let this module centralize
    # interactions with the social graph
    relations_.getUserRelations(userId, getDocs)

  getRelationsStatuses: (userId, usersIds)->
    getFriendsAndCoMembers userId
    .spread (friendsIds, coGroupMembersIds)->
      friends = _.intersection friendsIds, usersIds
      coGroupMembers = _.intersection coGroupMembersIds, usersIds
      # not looking for remaing users as there is no use to it for now
      return [friends, coGroupMembers]

  areFriends: (userId, otherId)->
    _.types arguments, 'strings...'
    relations_.getStatus(userId, otherId)
    .then (status)->
      if status is 'friends' then return true
      else false

  areFriendsOrGroupCoMembers: (userId, otherId)->
    _.types arguments, 'strings...'
    getFriendsAndCoMembers userId
    .spread (friendsIds, coGroupMembersIds)->
      return otherId in friendsIds or otherId in coGroupMembersIds


# result is to be .spread (friendsIds, coGroupMembersIds)->
getFriendsAndCoMembers = (userId)->
  promises_.all [
    relations_.getUserFriends(userId)
    groups_.findUserGroupsCoMembers(userId)
  ]
