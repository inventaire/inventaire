CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

user_ = __.require 'lib', 'user'

module.exports =
  getUsersData: (userId, friendId)->
    user_.fetchUsers [userId, friendId]
    .then (usersData)->
      [user, friend] = parseUsersData(userId, friendId, usersData)
      return context =
        user: user
        friend: friend
    .catch (err)-> _.error err, 'getUsersData err'



parseUsersData = (userId, friendId, usersData)->
  usersData = _.indexBy usersData, '_id'
  user = usersData[userId]
  friend = usersData[friendId]
  _.types [user, friend], ['object', 'object']
  return [user, friend]