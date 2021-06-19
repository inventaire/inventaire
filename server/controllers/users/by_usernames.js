const user_ = require('controllers/user/lib/user')

const sanitization = {
  usernames: {}
}

const controller = async ({ usernames, reqUserId }) => {
  const users = await user_.getUsersIndexByUsernames(reqUserId, usernames)
  return { users }
}

module.exports = { sanitization, controller }
