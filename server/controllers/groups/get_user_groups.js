import { allUserGroups } from './lib/groups'

export default {
  sanitization: {},
  controller: async ({ reqUserId }) => {
    const groups = await allUserGroups(reqUserId)
    return { groups }
  }
}
