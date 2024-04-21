import { getUsersIndexedByIds } from '#controllers/user/lib/user'

const sanitization = {
  ids: {},
}

async function controller ({ ids, reqUserId }) {
  const users = await getUsersIndexedByIds(ids, reqUserId)
  return { users }
}

export default { sanitization, controller }
