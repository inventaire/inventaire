import { getGroupsWhereUserIsAdminOrMemberOrInvited } from './lib/groups.js'

export default {
  sanitization: {},
  controller: async ({ reqUserId }) => {
    const groups = await getGroupsWhereUserIsAdminOrMemberOrInvited(reqUserId)
    return { groups }
  },
}
