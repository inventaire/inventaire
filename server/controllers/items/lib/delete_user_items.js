import items_ from 'controllers/items/lib/items'

export default userId => {
  return items_.byOwner(userId)
  .then(items_.bulkDelete)
}
