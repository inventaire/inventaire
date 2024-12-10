import { getUsersFromArea, getUsersAuthorizedData } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  bbox: {},
}

async function controller ({ bbox, reqUserId }: SanitizedParameters) {
  let users = await getUsersFromArea(bbox)
  users = await getUsersAuthorizedData(users, reqUserId)
  return { users }
}

export default { sanitization, controller }
