import { getItemsByOwner, itemsBulkDelete } from '#controllers/items/lib/items'

export default userId => {
  return getItemsByOwner(userId)
  .then(itemsBulkDelete)
}
