import { getUsersIndexByUsernames } from '#controllers/user/lib/user'

const sanitization = {
  usernames: {},
}

async function controller ({ usernames, reqUserId }) {
  const users = await getUsersIndexByUsernames(reqUserId, usernames)
  return { users }
}

export default { sanitization, controller }
