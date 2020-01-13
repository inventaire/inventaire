const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

module.exports = {
  getRandomPosition: () => [ _.random(-180, 180), _.random(-180, 180) ],

  getUsersNearPosition: async (reqFn, position) => {
    const bbox = getBboxFromPosition(position)
    const url = `/api/users?action=search-by-position&bbox=${JSON.stringify(bbox)}`
    const { users } = await reqFn('get', url)
    return users
  }
}

const getBboxFromPosition = ([ lat, lng ]) => {
  return [ lng - 0.1, lat - 0.1, lng + 0.1, lat + 0.1 ]
}
