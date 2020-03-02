const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const relations_ = __.require('controllers', 'relations/lib/queries')
const deleteUserItems = __.require('controllers', 'items/lib/delete_user_items')
const { leaveAllGroups } = __.require('controllers', 'groups/lib/leave_groups')
const { cancelAllActiveTransactions } = __.require('controllers', 'transactions/lib/transactions')
const notifs_ = __.require('lib', 'notifications')
const { Track } = __.require('lib', 'track')
const { softDeleteById } = __.require('controllers', 'user/lib/delete')

module.exports = (req, res) => {
  const reqUserId = req.user._id

  _.warn(req.user, 'deleting user')

  softDeleteById(reqUserId)
  .then(cleanupEverything.bind(null, reqUserId))
  // triggering track before logging out
  // to get access to req.user before it's cleared
  .then(Track(req, [ 'user', 'delete' ]))
  .then(req.logout.bind(req))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const cleanupEverything = reqUserId => {
  return Promise.all([
    relations_.deleteUserRelations(reqUserId),
    leaveAllGroups(reqUserId),
    cancelAllActiveTransactions(reqUserId),
    notifs_.deleteAllByUserId(reqUserId)
  ])
  // Should be run after cancelling transactions, as transaction updates
  // might try to update items busyness state
  .then(() => deleteUserItems(reqUserId))
}
