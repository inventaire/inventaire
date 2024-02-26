import { getUsersIndexByUsernames } from '#controllers/user/lib/user'

const sanitization = {
  usernames: {},
}

const controller = async ({ usernames, reqUserId }) => {
  const users = await getUsersIndexByUsernames(reqUserId, usernames)
  return { users }
}

export default { sanitization, controller }
