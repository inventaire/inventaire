const getByAuthorizationLevel = require('./get_by_authorization_level')
const { byUser, byGroup } = require('./get_authorization_level')

// Return what the reqUserId user is allowed to see from a user or a group inventory
module.exports = {
  byUser: (userId, reqUserId) => byUser(userId, reqUserId).then(getItems),

  byGroup: (groupId, reqUserId) => byGroup(groupId, reqUserId).then(getItems)
}

const getItems = ({ authorizationLevel, usersIds }) => getByAuthorizationLevel[authorizationLevel](usersIds)
