const user_ = require('controllers/user/lib/user')

const sanitization = {
  bbox: {},
}

const controller = async ({ bbox, reqUserId }) => {
  let users = await user_.byPosition(bbox)
  users = await user_.getUsersAuthorizedData(users, reqUserId)
  return { users }
}

module.exports = { sanitization, controller }
