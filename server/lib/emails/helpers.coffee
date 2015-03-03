CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

user_ = __.require 'lib', 'user'

module.exports =
  getUsersData: (user1Id, user2Id)->
    user_.fetchUsers [user1Id, user2Id]
    .then (usersData)->
      [user1, user2] = parseUsersData(user1Id, user2Id, usersData)
      return context =
        user1: user1
        user2: user2
    .catch (err)-> _.error err, 'getUsersData err'


parseUsersData = (user1Id, user2Id, usersData)->
  usersData = _.indexBy usersData, '_id'
  user1 = usersData[user1Id]
  user2 = usersData[user2Id]
  _.types [user1, user2], ['object', 'object']
  return [user1, user2]
