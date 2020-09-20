const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const getInventoryAccessLevel = __.require('controllers', 'items/lib/get_inventory_access_level')

module.exports = async (userId, authentifiedUserPromise) => {
  const reqUserId = await getReqUserId(authentifiedUserPromise)

  const [ user, accessLevel ] = await Promise.all([
    user_.byId(userId),
    getInventoryAccessLevel(userId, reqUserId)
  ])

  return {
    users: [ user ],
    accessLevel,

    feedOptions: {
      title: user.username,
      description: user.bio,
      image: user.picture,
      queryString: `user=${user._id}`,
      pathname: `inventory/${user._id}`
    }
  }
}

const getReqUserId = async authentifiedUserPromise => {
  const reqUser = await authentifiedUserPromise
  if (reqUser) return reqUser._id
}
