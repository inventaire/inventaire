const { customAuthReq, getUser } = require('./utils')

module.exports = {
  getUsersNearPosition: async (position, user) => {
    user = user || await getUser()
    const bbox = getBboxFromPosition(position)
    const url = `/api/users?action=search-by-position&bbox=${JSON.stringify(bbox)}`
    const { users } = await customAuthReq(user, 'get', url)
    return users
  },

  deleteUser: user => customAuthReq(user, 'delete', '/api/user')
}

const getBboxFromPosition = ([ lat, lng ]) => {
  return [ lng - 0.1, lat - 0.1, lng + 0.1, lat + 0.1 ]
}
