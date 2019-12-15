const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const User = __.require('models', 'user')
const db = __.require('couch', 'base')('users')

module.exports = userId => {
  return getItemsCounts(userId)
  .then(itemsCounts => db.update(userId, User.updateItemsCounts(itemsCounts)))
  .then(() => _.info(`${userId} items counts updated`))
  .catch(_.Error('user updateSnapshotItemsCounts err'))
}

const getItemsCounts = userId => {
  return items_.byOwner(userId)
  .then(items => items.reduce(aggregateCounts, itemsCountsBase()))
}

const aggregateCounts = (index, item) => {
  const { listing, created } = item
  index[listing]['items:count'] += 1

  const lastAdd = index[listing]['items:last-add']
  if ((lastAdd == null) || (created > lastAdd)) {
    index[listing]['items:last-add'] = created
  }

  return index
}

const itemsCountsBase = () => ({
  private: { 'items:count': 0 },
  network: { 'items:count': 0 },
  public: { 'items:count': 0 }
})
