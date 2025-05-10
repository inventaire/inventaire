import { getUsersAuthorizedData, getUsersByBbox } from '#controllers/user/lib/user'
import { reqHasAdminAccess } from '#lib/user_access_levels'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { Req } from '#types/server'

const sanitization = {
  bbox: {},
} as const

async function controller ({ bbox, reqUserId }: SanitizedParameters, req: Req) {
  const reqUserHasAdminAccess = reqHasAdminAccess(req)
  const usersPromise = getUsersByBbox(bbox)
  const filteredUsers = await getUsersAuthorizedData(usersPromise, { reqUserId, reqUserHasAdminAccess })
  return { users: filteredUsers }
}

export default { sanitization, controller }
