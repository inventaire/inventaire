import relations_ from '#controllers/relations/lib/queries'
import deleteUserItems from '#controllers/items/lib/delete_user_items'
import { deleteUserShelves } from '#controllers/shelves/lib/shelves'
import { deleteUserListingsAndElements } from '#controllers/listings/lib/listings'
import { leaveAllGroups } from '#controllers/groups/lib/leave_groups'
import { cancelAllActiveTransactions } from '#controllers/transactions/lib/transactions'
import notifications_ from '#controllers/notifications/lib/notifications'
import { softDeleteById } from '#controllers/user/lib/delete'

export default async userId => {
  const res = await softDeleteById(userId)
  await Promise.all([
    relations_.deleteUserRelations(userId),
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
