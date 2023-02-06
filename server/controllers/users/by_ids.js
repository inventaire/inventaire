import { getUsersIndexedByIds } from '#controllers/user/lib/user'

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }) => {
  const users = await getUsersIndexedByIds(ids, reqUserId)
  return { users }
}

export default { sanitization, controller }
