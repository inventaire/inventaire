// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const assert_ = __.require('utils', 'assert_types')
const user_ = __.require('controllers', 'user/lib/user')
const groups_ = __.require('controllers', 'groups/lib/groups')

exports.getUsersByIds = (user1Id, user2Id) => user_.byIds([ user1Id, user2Id ])
.then(usersData => {
  let context
  const [ user1, user2 ] = Array.from(parseUsersData(user1Id, user2Id, usersData))
  return context = { user1, user2 }
})
.catch(_.Error('getUsersByIds err'))

const parseUsersData = (user1Id, user2Id, usersData) => {
  usersData = _.keyBy(usersData, '_id')
  const user1 = usersData[user1Id]
  const user2 = usersData[user2Id]
  assert_.objects([ user1, user2 ])
  return [ user1, user2 ]
}

exports.getGroupAndUsersData = (groupId, actingUserId, userToNotifyId) => promises_.all([
  groups_.byId(groupId),
  user_.byId(actingUserId),
  user_.byId(userToNotifyId)
])
.spread((group, actingUser, userToNotify) => {
  let context
  return context = {
    group,
    actingUser,
    userToNotify
  }
})

exports.catchDisabledEmails = err => {
  if (err.type === 'email_disabled') {
    return _.warn(err.context, err.message)
  } else {
    throw err
  }
}
