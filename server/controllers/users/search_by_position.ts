import { getUserByPosition, getUsersAuthorizedData } from '#controllers/user/lib/user'

const sanitization = {
  bbox: {},
}

const controller = async ({ bbox, reqUserId }) => {
  let users = await getUserByPosition(bbox)
  users = await getUsersAuthorizedData(users, reqUserId)
  return { users }
}

export default { sanitization, controller }
