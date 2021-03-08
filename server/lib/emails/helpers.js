const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const user_ = require('controllers/user/lib/user')
const groups_ = require('controllers/groups/lib/groups')

const getUsersByIds = (user1Id, user2Id) => {
  return user_.byIds([ user1Id, user2Id ])
  .then(usersData => {
    const [ user1, user2 ] = parseUsersData(user1Id, user2Id, usersData)
    return { user1, user2 }
  })
  .catch(_.Error('getUsersByIds err'))
}

const parseUsersData = (user1Id, user2Id, usersData) => {
  usersData = _.keyBy(usersData, '_id')
  const user1 = usersData[user1Id]
  const user2 = usersData[user2Id]
  assert_.objects([ user1, user2 ])
  return [ user1, user2 ].map(user_.serializeData)
}

const getGroupAndUsersData = (groupId, actingUserId, userToNotifyId) => {
  return Promise.all([
    groups_.byId(groupId),
    user_.byId(actingUserId),
    user_.byId(userToNotifyId)
  ])
  .then(([ group, actingUser, userToNotify ]) => {
    return {
      group,
      actingUser: user_.serializeData(actingUser),
      userToNotify: user_.serializeData(userToNotify)
    }
  })
}

const catchDisabledEmails = err => {
  if (err.type === 'email_disabled') _.warn(err.context, err.message)
  else throw err
}

module.exports = { getUsersByIds, getGroupAndUsersData, catchDisabledEmails }
