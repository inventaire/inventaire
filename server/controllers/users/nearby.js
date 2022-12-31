import user_ from 'controllers/user/lib/user'

const sanitization = {
  range: {}
}

const controller = async ({ reqUserId, range }) => {
  const usersIds = await user_.nearby(reqUserId, range)
  const users = await user_.getUsersByIds(usersIds, reqUserId)
  return { users }
}

export default { sanitization, controller }
