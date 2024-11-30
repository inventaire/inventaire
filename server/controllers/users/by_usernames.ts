import { getUsersIndexByUsernames } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  usernames: {},
}

async function controller ({ usernames, reqUserId }: SanitizedParameters) {
  const users = await getUsersIndexByUsernames(reqUserId, usernames)
  return { users }
}

export default { sanitization, controller }
