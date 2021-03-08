const __ = require('config').universalPath
const relations_ = require('controllers/relations/lib/queries')
const deleteUserItems = require('controllers/items/lib/delete_user_items')
const { deleteUserShelves } = require('controllers/shelves/lib/shelves')
const { leaveAllGroups } = require('controllers/groups/lib/leave_groups')
const { cancelAllActiveTransactions } = require('controllers/transactions/lib/transactions')
const notifications_ = require('controllers/notifications/lib/notifications')
const { softDeleteById } = require('controllers/user/lib/delete')

module.exports = async userId => {
  const res = await softDeleteById(userId)
  await Promise.all([
    relations_.deleteUserRelations(userId),
    leaveAllGroups(userId),
    cancelAllActiveTransactions(userId),
    notifications_.deleteAllByUserId(userId),
    deleteUserShelves(userId),
  ])
  // Should be run after cancelling transactions, as transaction updates
  // might try to update items busyness state
  await deleteUserItems(userId)
  return res
}
