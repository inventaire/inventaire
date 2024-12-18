import { getUsersByBbox, getUsersAuthorizedData } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  bbox: {},
}

async function controller ({ bbox, reqUserId }: SanitizedParameters) {
  const usersPromise = getUsersByBbox(bbox)
  const filteredUsers = await getUsersAuthorizedData(usersPromise, reqUserId)
  return { users: filteredUsers }
}

export default { sanitization, controller }
