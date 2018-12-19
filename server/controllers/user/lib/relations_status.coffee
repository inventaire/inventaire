CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
groups_ = __.require 'controllers', 'groups/lib/groups'
relations_ = __.require 'controllers', 'relations/lib/queries'
promises_ = __.require 'lib', 'promises'

module.exports =
  getUserRelations: (userId)->
    # just proxiing to let this module centralize
    # interactions with the social graph
    relations_.getUserRelations userId

  getRelationsStatuses: (userId, usersIds)->
    unless userId? then return promises_.resolve [ [], [], usersIds ]

    getFriendsAndGroupCoMembers userId
    .spread spreadRelations(usersIds)

  areFriends: (userId, otherId)->
    _.assertTypes arguments, 'strings...'
    relations_.getStatus(userId, otherId)
    .then (status)->
      if status is 'friends' then return true
      else false

  areFriendsOrGroupCoMembers: (userId, otherId)->
    _.assertTypes arguments, 'strings...'
    getFriendsAndGroupCoMembers userId
    .spread (friendsIds, coGroupMembersIds)->
      return otherId in friendsIds or otherId in coGroupMembersIds

  getNetworkIds: (userId)->
    unless userId? then return promises_.resolve []
    getFriendsAndGroupCoMembers userId
    .then _.flatten

spreadRelations = (usersIds)-> (friendsIds, coGroupMembersIds)->
  friends = []
  coGroupMembers = []
  publik = []

  for id in usersIds
    if id in friendsIds then friends.push id
    else if id in coGroupMembersIds then coGroupMembers.push id
    else publik.push id

  return [ friends, coGroupMembers, publik ]

# result is to be .spread (friendsIds, coGroupMembersIds)->
getFriendsAndGroupCoMembers = (userId)->
  promises_.all [
    relations_.getUserFriends(userId)
    groups_.findUserGroupsCoMembers(userId)
  ]
