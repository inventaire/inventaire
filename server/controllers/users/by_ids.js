const user_ = require('controllers/user/lib/user')

const sanitization = {
  ids: {}
}

const controller = async ({ ids, reqUserId }) => {
  const users = await user_.getUsersIndexByIds(ids, reqUserId)
  return { users }
}

module.exports = { sanitization, controller }
