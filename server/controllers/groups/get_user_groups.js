import { allUserGroups } from './lib/groups.js'

export default {
  sanitization: {},
  controller: async ({ reqUserId }) => {
    const groups = await allUserGroups(reqUserId)
    return { groups }
  }
}
