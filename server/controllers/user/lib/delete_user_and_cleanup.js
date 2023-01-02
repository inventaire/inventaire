import { leaveAllGroups } from '#controllers/groups/lib/leave_groups'
import deleteUserItems from '#controllers/items/lib/delete_user_items'
import { deleteUserListingsAndElements } from '#controllers/listings/lib/listings'
import notifications_ from '#controllers/notifications/lib/notifications'
import { deleteUserRelations } from '#controllers/relations/lib/lists'
import { deleteUserShelves } from '#controllers/shelves/lib/shelves'
import { cancelAllActiveTransactions } from '#controllers/transactions/lib/transactions'
import { softDeleteById } from '#controllers/user/lib/delete'

export default async userId => {
  const res = await softDeleteById(userId)
  await Promise.all([
    deleteUserRelations(userId),
    leaveAllGroups(userId),
    cancelAllActiveTransactions(userId),
    notifications_.deleteAllByUserId(userId),
    deleteUserShelves(userId),
    deleteUserListingsAndElements(userId),
  ])
  // Should be run after cancelling transactions, as transaction updates
  // might try to update items busyness state
  await deleteUserItems(userId)
  return res
}
