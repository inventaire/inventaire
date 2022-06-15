const user_ = require('controllers/user/lib/user')

module.exports = async (userId, reqUserId) => {
  const user = await user_.byId(userId)
  return {
    users: [ user ],
    reqUserId,
    feedOptions: {
      title: user.username,
      description: user.bio,
      image: user.picture,
      queryString: `user=${user._id}`,
      pathname: `inventory/${user._id}`
    }
  }
}
