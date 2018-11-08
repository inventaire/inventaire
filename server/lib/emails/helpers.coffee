CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'controllers', 'user/lib/user'
groups_ = __.require 'controllers', 'groups/lib/groups'

exports.getUsersByIds = (user1Id, user2Id)->
  user_.byIds [ user1Id, user2Id ]
  .then (usersData)->
    [ user1, user2 ] = parseUsersData(user1Id, user2Id, usersData)
    return context = { user1, user2 }
  .catch _.Error('getUsersByIds err')

parseUsersData = (user1Id, user2Id, usersData)->
  usersData = _.keyBy usersData, '_id'
  user1 = usersData[user1Id]
  user2 = usersData[user2Id]
  _.types [ user1, user2 ], [ 'object', 'object' ]
  return [ user1, user2 ]


exports.getGroupAndUsersData = (groupId, actingUserId, userToNotifyId)->
  promises_.all [
    groups_.byId groupId
    user_.byId actingUserId
    user_.byId userToNotifyId
  ]
  .spread (group, actingUser, userToNotify)->
    return context =
      group: group
      actingUser: actingUser
      userToNotify: userToNotify

exports.catchDisabledEmails = (err)->
  if err.type is 'email_disabled' then _.warn err.context, err.message
  else throw err
