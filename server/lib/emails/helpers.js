import _ from '#builders/utils'
import { getGroupById } from '#controllers/groups/lib/groups'
import { getUserById, getUsersByIds, serializeUserData } from '#controllers/user/lib/user'
import { assert_ } from '#lib/utils/assert_types'
import { LogError, warn } from '#lib/utils/logs'

export const getParsedUsersIndexedByIds = (user1Id, user2Id) => {
  return getUsersByIds([ user1Id, user2Id ])
  .then(usersData => {
    const [ user1, user2 ] = parseUsersData(user1Id, user2Id, usersData)
    return { user1, user2 }
  })
  .catch(LogError('getParsedUsersIndexedByIds err'))
}

const parseUsersData = (user1Id, user2Id, usersData) => {
  usersData = _.keyBy(usersData, '_id')
  const user1 = usersData[user1Id]
  const user2 = usersData[user2Id]
  assert_.objects([ user1, user2 ])
  return [ user1, user2 ].map(serializeUserData)
}

export const getGroupAndUsersData = (groupId, actingUserId, userToNotifyId) => {
  return Promise.all([
    getGroupById(groupId),
    getUserById(actingUserId),
    getUserById(userToNotifyId),
  ])
  .then(([ group, actingUser, userToNotify ]) => {
    return {
      group,
      actingUser: serializeUserData(actingUser),
      userToNotify: serializeUserData(userToNotify),
    }
  })
}

export const catchDisabledEmails = err => {
  if (err.type === 'email_disabled') warn(err.context, err.message)
  else throw err
}
