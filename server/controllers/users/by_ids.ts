import type { UserExtraAttribute } from '#controllers/user/lib/authorized_user_data_pickers'
import { getUsersIndexedByIds } from '#controllers/user/lib/user'
import { hasAdminAccess } from '#lib/user_access_levels'
import type { Req } from '#types/server'

const sanitization = {
  ids: {},
}

async function controller ({ ids, reqUserId }, req: Req) {
  let extraAttribute: UserExtraAttribute
  if ('user' in req && hasAdminAccess(req.user)) {
    extraAttribute = 'reports'
  }
  const users = await getUsersIndexedByIds(ids, reqUserId, extraAttribute)
  return { users }
}

export default { sanitization, controller }
