// Keep the user snapshot data about the state of her items updated
// taking care of avoiding edit conflicts on the user document when several items
// are created/edited in a short period of time

const _ = require('builders/utils')
const radio = require('lib/radio')
const updateSnapshotItemsCounts = require('./update_snapshot_items_counts')
const { itemsCountDebounceTime: delay } = require('config')

module.exports = () => {
  const debouncedUpdaters = {}

  const itemsCountsUpdater = userId => () => {
    // When it gets to be called, remove the lazy updater
    // to prevent blocking memory undefinitely
    delete debouncedUpdaters[userId]
    return updateSnapshotItemsCounts(userId)
    .catch(_.Error('user itemsCountsUpdater err'))
  }

  radio.on('user:inventory:update', userId => {
    // Creating a personnalized debouncer as a global debounce would be delayed
    // undefinitely "at scale"
    if (!debouncedUpdaters[userId]) {
      debouncedUpdaters[userId] = _.debounce(itemsCountsUpdater(userId), delay)
    }
    return debouncedUpdaters[userId]()
  })
}
