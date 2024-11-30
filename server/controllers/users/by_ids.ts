import type { UserExtraAttribute } from '#controllers/user/lib/authorized_user_data_pickers'
import { getUsersIndexedByIds } from '#controllers/user/lib/user'
import { hasAdminAccess } from '#lib/user_access_levels'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'

const sanitization = {
  ids: {},
}

async function controller ({ ids, reqUserId }: SanitizedParameters, req: AuthentifiedReq) {
  let extraAttribute: UserExtraAttribute
  if ('user' in req && hasAdminAccess(req.user)) {
    extraAttribute = 'reports'
  }
  const users = await getUsersIndexedByIds(ids, reqUserId, extraAttribute)
  return { users }
}

export default { sanitization, controller }
