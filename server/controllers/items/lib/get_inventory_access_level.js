const __ = require('config').universalPath
const { areFriendsOrGroupCoMembers } = __.require('controllers', 'user/lib/relations_status')

module.exports = async (userId, reqUserId) => {
  if (!reqUserId) return 'public'
  if (userId === reqUserId) return 'private'

  const usersAreFriendsOrGroupCoMembers = await areFriendsOrGroupCoMembers(userId, reqUserId)
  if (usersAreFriendsOrGroupCoMembers) return 'network'
  else return 'public'
}
