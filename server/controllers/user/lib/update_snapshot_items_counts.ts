import { getItemsByOwner } from '#controllers/items/lib/items'
import dbFactory from '#db/couchdb/base'
import { info, LogError } from '#lib/utils/logs'
import { getVisibilitySummaryKey } from '#lib/visibility/visibility'
import { updateUserItemsCounts } from '#models/user'

const db = await dbFactory('users')

export default userId => {
  return getItemsByOwner(userId)
  .then(getItemsCounts)
  .then(itemsCounts => db.update(userId, updateUserItemsCounts(itemsCounts)))
  .then(() => info(`${userId} items counts updated`))
  .catch(LogError('user updateSnapshotItemsCounts err'))
}

function getItemsCounts (items) {
  const counts = {
    private: { 'items:count': 0 },
    network: { 'items:count': 0 },
    public: { 'items:count': 0 },
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
