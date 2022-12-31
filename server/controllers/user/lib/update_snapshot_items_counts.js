import _ from 'builders/utils'
import items_ from 'controllers/items/lib/items'
import { getVisibilitySummaryKey } from 'lib/visibility/visibility'
import User from 'models/user'
import dbFactory from 'db/couchdb/base'
const db = dbFactory('users')

export default userId => {
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
    const { visibility, created } = item
    const listing = getVisibilitySummaryKey(visibility)
    counts[listing]['items:count'] += 1
    const lastAdd = counts[listing]['items:last-add'] || 0
    if (created > lastAdd) {
      counts[listing]['items:last-add'] = created
    }
  })

  return counts
}
