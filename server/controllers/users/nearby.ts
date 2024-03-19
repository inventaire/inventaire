import { getUsersAuthorizedDataByIds, getUsersNearby } from '#controllers/user/lib/user'

const sanitization = {
  range: {},
}

const controller = async ({ reqUserId, range }) => {
  const usersIds = await getUsersNearby(reqUserId, range)
  const users = await getUsersAuthorizedDataByIds(usersIds, reqUserId)
  return { users }
}

export default { sanitization, controller }
