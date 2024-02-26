// Keep the user snapshot data about the state of her items updated
// taking care of avoiding edit conflicts on the user document when several items
// are created/edited in a short period of time

import CONFIG from 'config'
import { debounce } from 'lodash-es'
import { radio } from '#lib/radio'
import { LogError } from '#lib/utils/logs'
import updateSnapshotItemsCounts from './update_snapshot_items_counts.js'

const { itemsCountDebounceTime: delay } = CONFIG

export function keepSnapshotItemsCountsUpdated () {
  const debouncedUpdaters = {}

  const itemsCountsUpdater = userId => () => {
    // When it gets to be called, remove the lazy updater
    // to prevent blocking memory undefinitely
    delete debouncedUpdaters[userId]
    return updateSnapshotItemsCounts(userId)
    .catch(LogError('user itemsCountsUpdater err'))
  }

  radio.on('user:inventory:update', userId => {
    // Creating a personnalized debouncer as a global debounce would be delayed
    // undefinitely "at scale"
    if (!debouncedUpdaters[userId]) {
      debouncedUpdaters[userId] = debounce(itemsCountsUpdater(userId), delay)
    }
    return debouncedUpdaters[userId]()
  })
}
