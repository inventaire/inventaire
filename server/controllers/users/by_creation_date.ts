import { omitPrivateData, type UserExtraAttribute } from '#controllers/user/lib/authorized_user_data_pickers'
import { getUsersByCreationDate } from '#controllers/users/lib/users'
import { hasAdminAccess } from '#lib/user_access_levels'

const sanitization = {
  limit: {},
  offset: {},
}

async function controller ({ limit, offset, reqUserId }, req) {
  let extraAttribute: UserExtraAttribute
  if ('user' in req && hasAdminAccess(req.user)) {
    extraAttribute = 'reports'
  }
  const users = await getUsersByCreationDate({ limit, offset })
  return {
    users: users.map(omitPrivateData(reqUserId, [], extraAttribute)),
  }
}

export default { sanitization, controller }
