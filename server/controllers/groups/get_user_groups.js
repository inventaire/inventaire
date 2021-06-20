const { allUserGroups } = require('./lib/groups')

module.exports = {
  sanitization: {},
  controller: async ({ reqUserId }) => {
    const groups = await allUserGroups(reqUserId)
    return { groups }
  }
}
