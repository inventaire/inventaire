import { getUsersAuthorizedDataByIds, getUsersNearby } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  range: {},
}

async function controller ({ reqUserId, range }: SanitizedParameters) {
  const usersIds = await getUsersNearby(reqUserId, range)
  const users = await getUsersAuthorizedDataByIds(usersIds, reqUserId)
  return { users }
}

export default { sanitization, controller }
