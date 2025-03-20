import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { getGroupsWhereUserIsAdminOrMemberOrInvited } from './lib/groups.js'

async function controller ({ reqUserId }: SanitizedParameters) {
  const groups = await getGroupsWhereUserIsAdminOrMemberOrInvited(reqUserId)
  return { groups }
}

export default {
  sanitization: {},
  controller,
}

export type GetUserGroupsResponse = Awaited<ReturnType<typeof controller>>
