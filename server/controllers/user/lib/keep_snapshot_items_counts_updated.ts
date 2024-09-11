// Keep the user snapshot data about the state of her items updated
// taking care of avoiding edit conflicts on the user document when several items
// are created/edited in a short period of time

import { debounceByKey } from '#lib/debounce_by_key'
import { radio } from '#lib/radio'
import config from '#server/config'
import type { UserId } from '#server/types/user'
import { updateSnapshotItemsCounts } from './update_snapshot_items_counts.js'

const { snapshotsDebounceTime: delay } = config

export function keepSnapshotItemsCountsUpdated () {
  const lazyItemsCountsUpdater = debounceByKey(updateSnapshotItemsCounts, delay)

  radio.on('user:inventory:update', (userId: UserId) => {
    lazyItemsCountsUpdater(userId)
  })
}
