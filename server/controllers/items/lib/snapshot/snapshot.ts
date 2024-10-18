// Entity data snapshots are an attributes of the snapshot object associated with item documents:
// - entity:title
// - entity:lang
// - entity:authors
// - entity:series
// - entity:image
// - entity:ordinal

// Their role is to keep a copy at hand of data deduced from the item's entity
// and its graph: typically, the edition the item is an instance of, the edition work,
// (or works in case of a multi-works edition), the work(s) authors, the serie(s)
// the work(s) might be part of.
// Being able to have a succint version of those data accessible from the cache
// allows to display basic data or filter large lists of items by text
// without having to query from 3 to 10+ entities per item

import pTimeout from 'p-timeout'
import { refreshSnapshotFromUri } from '#controllers/items/lib/snapshot/refresh_snapshot'
import { leveldbFactory } from '#db/level/get_sub_db'
import { formatBatchOps } from '#db/level/utils'
import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import { logError } from '#lib/utils/logs'
import type { EntityUri } from '#types/entity'
import type { ItemSnapshot, SerializedItem } from '#types/item'

const db = leveldbFactory('snapshot', 'json')

export async function addSnapshotToItem (item: SerializedItem) {
  if (item.snapshot) return item

  try {
    assert_.string(item.entity)
    item.snapshot = await getSnapshot(item.entity)
  } catch (err) {
    err.context = err.context || {}
    err.context.item = item
    logError(err, 'addSnapshotToItem error')
    item.snapshot = item.snapshot || {}
  }

  return item
}

export interface SnapshotOperation {
  key: EntityUri
  value: ItemSnapshot
}
export const saveSnapshotsInBatch = (ops: SnapshotOperation[]) => db.batch(formatBatchOps(ops))

async function getSnapshot (uri: EntityUri, preventLoop?: boolean) {
  // Setting a timeout as it happened in the past that leveldb would hang without responding.
  // This problem might have been fixed by updating leveldb dependencies,
  // but in case this happens again, this timeout would save a good hour of debugging
  // To be removed once this bug is long gone
  let snapshot
  try {
    snapshot = await pTimeout(db.get(uri), 50000)
  } catch (err) {
    if (err.name === 'TimeoutError') logError(err, `getSnapshot db.get(${uri}) TimeoutError`)
    if (!(err.notFound || err.name === 'TimeoutError')) throw err
  }

  if (snapshot != null) return snapshot

  if (preventLoop === true) {
    // Known case: addSnapshotToItem was called for an item which entity is a serie
    // thus, the related works and editions were refreshed but as series aren't
    // supposed to be associated to items, no snapshot was created for the serie itself
    const err = newError("couldn't refresh item snapshot", 500, { uri })
    logError(err, 'getSnapshot err')
    return {}
  }

  return refreshAndGetSnapshot(uri)
}

async function refreshAndGetSnapshot (uri: EntityUri) {
  await refreshSnapshotFromUri(uri)
  return getSnapshot(uri, true)
}
