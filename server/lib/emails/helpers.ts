import { keyBy } from 'lodash-es'
import { getGroupById } from '#controllers/groups/lib/groups'
import { getUserById, getUsersByIds, serializeUserData } from '#controllers/user/lib/user'
import { assertObjects } from '#lib/utils/assert_types'
import { LogError, warn } from '#lib/utils/logs'

export function getParsedUsersIndexedByIds (user1Id, user2Id) {
  return getUsersByIds([ user1Id, user2Id ])
  .then(usersData => {
    const [ user1, user2 ] = parseUsersData(user1Id, user2Id, usersData)
    return { user1, user2 }
  })
  .catch(LogError('getParsedUsersIndexedByIds err'))
}

function parseUsersData (user1Id, user2Id, usersData) {
  usersData = keyBy(usersData, '_id')
  const user1 = usersData[user1Id]
  const user2 = usersData[user2Id]
  assertObjects([ user1, user2 ])
  return [ user1, user2 ].map(serializeUserData)
}

export function getGroupAndUsersData (groupId, actingUserId, userToNotifyId) {
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

export function catchDisabledEmails (err) {
  if (err.type === 'email_disabled') warn(err.context, err.message)
  else throw err
}
