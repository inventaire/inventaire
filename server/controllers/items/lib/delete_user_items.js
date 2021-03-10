const items_ = require('controllers/items/lib/items')

module.exports = userId => {
  return items_.byOwner(userId)
  .then(items_.bulkDelete)
}
