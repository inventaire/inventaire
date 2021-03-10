const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const User = require('models/user')
const db = require('db/couchdb/base')('users')

module.exports = userId => {
  return items_.byOwner(userId)
  .then(getItemsCounts)
  .then(itemsCounts => db.update(userId, User.updateItemsCounts(itemsCounts)))
  .then(() => _.info(`${userId} items counts updated`))
  .catch(_.Error('user updateSnapshotItemsCounts err'))
}

const getItemsCounts = items => {
  const counts = {
    private: { 'items:count': 0 },
    network: { 'items:count': 0 },
    public: { 'items:count': 0 }
  }

  items.forEach(item => {
    const { listing, created } = item
    counts[listing]['items:count'] += 1
    const lastAdd = counts[listing]['items:last-add'] || 0
    if (created > lastAdd) {
      counts[listing]['items:last-add'] = created
    }
  })

  return counts
}
