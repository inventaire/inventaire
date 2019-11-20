const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const User = __.require('models', 'user')

// Working around the circular dependency
let user_
const lateRequire = () => { user_ = __.require('controllers', 'user/lib/user') }
setTimeout(lateRequire, 0)

module.exports = userId => getItemsCounts(userId)
.then(itemsCounts => user_.db.update(userId, User.updateItemsCounts(itemsCounts))).then(() => _.info(`${userId} items counts updated`))
.catch(_.Error('user updateSnapshotItemsCounts err'))

const getItemsCounts = userId => items_.byOwner(userId)
.then(items => items.reduce(aggregateCounts, itemsCountsBase()))

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
