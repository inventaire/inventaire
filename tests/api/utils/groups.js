const { customAuthReq, getUser } = require('./utils')

module.exports = {
  updateGroup: async ({ group, user, attribute, value }) => {
    user = user || await getUser()
    return customAuthReq(user, 'put', '/api/groups?action=update-settings', {
      group: group._id,
      attribute,
      value
    })
  },
}
