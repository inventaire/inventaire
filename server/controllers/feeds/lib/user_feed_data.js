const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const { areFriendsOrGroupCoMembers } = __.require('controllers', 'user/lib/relations_status')

module.exports = (userId, authentifiedUserPromise) => {
  return Promise.all([
    user_.byId(userId),
    getAccessLevel(userId, authentifiedUserPromise)
  ])
  .then(([ user, getAccessLevel ]) => ({
    users: [ user ],
    accessLevel: getAccessLevel,

    feedOptions: {
      title: user.username,
      description: user.bio,
      image: user.picture,
      queryString: `user=${user._id}`,
      pathname: `inventory/${user._id}`
    }
  }))
}

const getAccessLevel = (userId, authentifiedUserPromise) => {
  return authentifiedUserPromise
  .then(requester => {
    if (requester == null) return 'public'

    const requesterId = requester._id

    if (requesterId === userId) return 'private'

    return areFriendsOrGroupCoMembers(userId, requester._id)
    .then(bool => bool ? 'network' : 'public')
  })
}
