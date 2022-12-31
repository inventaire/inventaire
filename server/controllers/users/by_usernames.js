import user_ from 'controllers/user/lib/user'

const sanitization = {
  usernames: {}
}

const controller = async ({ usernames, reqUserId }) => {
  const users = await user_.getUsersIndexByUsernames(reqUserId, usernames)
  return { users }
}

export default { sanitization, controller }
