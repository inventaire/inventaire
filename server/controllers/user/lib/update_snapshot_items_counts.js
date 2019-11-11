// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const User = __.require('models', 'user')

// Working around the circular dependency
let user_ = null
const lateRequire = () => user_ = __.require('controllers', 'user/lib/user')
setTimeout(lateRequire, 0)

module.exports = userId => getItemsCounts(userId)
.then(itemsCounts => user_.db.update(userId, User.updateItemsCounts(itemsCounts))).then(() => _.info(`${userId} items counts updated`))
.catch(_.Error('user updateSnapshotItemsCounts err'))

var getItemsCounts = userId => items_.byOwner(userId)
.then(items => items.reduce(aggregateCounts, itemsCountsBase()))

var aggregateCounts = function(index, item){
  const { listing, created } = item
  index[listing]['items:count'] += 1

  const lastAdd = index[listing]['items:last-add']
  if ((lastAdd == null) || (created > lastAdd)) {
    index[listing]['items:last-add'] = created
  }

  return index
}

var itemsCountsBase = () => ({
  'private': { 'items:count': 0 },
  'network': { 'items:count': 0 },
  'public': { 'items:count': 0 }
})
