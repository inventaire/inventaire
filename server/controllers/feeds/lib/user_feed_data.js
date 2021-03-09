const user_ = require('controllers/user/lib/user')
const getInventoryAccessLevel = require('controllers/items/lib/get_inventory_access_level')

module.exports = async (userId, reqUserId) => {
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
